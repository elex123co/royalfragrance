import type { SupabaseClient } from "@supabase/supabase-js";
import { gatherContext } from "./context";
import { decideContent } from "./decide";
import { generateNewsletter } from "./generate";
import { validateNewsletter } from "./validate";
import { sendNewsletterToSubscribers } from "./send";
import type { DecisionContext, GeneratedNewsletter } from "./types";

export interface NewsletterCycleResult {
  success: boolean;
  newsletterId?: string;
  status: "sent" | "draft" | "held_for_review" | "failed";
  reason?: string;
  sentCount?: number;
}

/**
 * Runs one full generation cycle. `dryRun: true` (used by the admin
 * "Generate Preview" button) stops after producing a draft — it never
 * sends and never touches storyline continuity, so testing doesn't
 * consume a real story episode or spam subscribers.
 */
export async function runNewsletterCycle(
  supabase: SupabaseClient,
  dayOfWeek: DecisionContext["dayOfWeek"],
  { dryRun = false }: { dryRun?: boolean } = {}
): Promise<NewsletterCycleResult> {
  const { data: settings } = await supabase.from("newsletter_settings").select("automation_enabled").eq("id", 1).single();
  if (!dryRun && settings && settings.automation_enabled === false) {
    return { success: false, status: "failed", reason: "Automation is paused" };
  }

  const context = await gatherContext(supabase, dayOfWeek);
  const decision = decideContent(context);

  let draft: GeneratedNewsletter;
  let validation;
  try {
    draft = await generateNewsletter(context, decision);
    validation = validateNewsletter(draft, context);

    if (!validation.valid) {
      // One controlled retry, per the spec's validation-failure flow.
      draft = await generateNewsletter(context, decision);
      validation = validateNewsletter(draft, context);
    }
  } catch (err) {
    console.error("Newsletter generation failed:", err);
    return { success: false, status: "failed", reason: String(err) };
  }

  const featuredProductIds = context.featuredProducts
    .filter((p) => validation.sanitized.featuredProductNames?.some((n) => n.toLowerCase() === p.name.toLowerCase()))
    .map((p) => p.id);

  if (!validation.valid) {
    const { data: held } = await supabase
      .from("newsletters")
      .insert({
        title: validation.sanitized.title || "Untitled draft",
        subject: validation.sanitized.subject || "(no subject)",
        preview_text: validation.sanitized.previewText,
        content: validation.sanitized.content || "",
        content_type: decision.contentType,
        tone: validation.sanitized.tone,
        status: "held_for_review",
        featured_product_ids: featuredProductIds,
        send_error: validation.reason,
      })
      .select("id")
      .single();

    return {
      success: false,
      status: "held_for_review",
      reason: validation.reason,
      newsletterId: held?.id,
    };
  }

  const finalDraft = validation.sanitized;

  // Storyline continuity bookkeeping — skipped entirely on dry runs.
  let storylineId: string | null = null;
  let episodeNumber: number | null = null;

  if (!dryRun && decision.storylineAction === "start_new" && finalDraft.storylineTitle) {
    const { data: newStoryline } = await supabase
      .from("storylines")
      .insert({
        title: finalDraft.storylineTitle,
        summary: finalDraft.storylineSummaryUpdate ?? finalDraft.content.slice(0, 300),
        current_episode: 1,
      })
      .select("id")
      .single();
    storylineId = newStoryline?.id ?? null;
    episodeNumber = 1;
  } else if (!dryRun && decision.storylineAction === "continue" && context.activeStoryline) {
    storylineId = context.activeStoryline.id;
    episodeNumber = context.activeStoryline.current_episode + 1;
    await supabase
      .from("storylines")
      .update({
        current_episode: episodeNumber,
        summary: finalDraft.storylineSummaryUpdate ?? context.activeStoryline.summary,
        last_updated_at: new Date().toISOString(),
        status: finalDraft.isCliffhanger === false && episodeNumber > 8 ? "completed" : "active",
      })
      .eq("id", storylineId);
  }

  let confessionNumber: number | null = null;
  if (decision.contentType === "scent_confession") {
    const { count } = await supabase
      .from("newsletters")
      .select("id", { count: "exact", head: true })
      .eq("content_type", "scent_confession");
    confessionNumber = (count ?? 0) + 1;
  }

  const { data: newsletter, error } = await supabase
    .from("newsletters")
    .insert({
      title: finalDraft.title,
      subject: finalDraft.subject,
      preview_text: finalDraft.previewText,
      content: finalDraft.content,
      content_type: decision.contentType,
      tone: finalDraft.tone,
      status: dryRun ? "draft" : "draft",
      storyline_id: storylineId,
      episode_number: episodeNumber,
      confession_number: confessionNumber,
      featured_product_ids: featuredProductIds,
      is_interactive: !!finalDraft.interactiveQuestion,
      interactive_question: finalDraft.interactiveQuestion,
      interactive_choices: finalDraft.interactiveChoices,
    })
    .select("*")
    .single();

  if (error || !newsletter) {
    return { success: false, status: "failed", reason: error?.message };
  }

  if (dryRun) {
    return { success: true, status: "draft", newsletterId: newsletter.id };
  }

  try {
    const { sent, failed } = await sendNewsletterToSubscribers(supabase, newsletter);
    await supabase
      .from("newsletters")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", newsletter.id);

    await supabase.from("audit_logs").insert({
      action: "newsletter.sent",
      entity_type: "newsletter",
      entity_id: newsletter.id,
      metadata: { contentType: decision.contentType, sent, failed },
    });

    return { success: true, status: "sent", newsletterId: newsletter.id, sentCount: sent };
  } catch (err) {
    await supabase
      .from("newsletters")
      .update({ status: "failed", send_error: String(err) })
      .eq("id", newsletter.id);
    return { success: false, status: "failed", newsletterId: newsletter.id, reason: String(err) };
  }
}
