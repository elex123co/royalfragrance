"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "./require-admin";
import { runNewsletterCycle } from "@/lib/newsletter/run";
import { sendNewsletterToSubscribers } from "@/lib/newsletter/send";

export async function toggleAutomation(enabled: boolean) {
  const { admin } = await requireAdmin();
  const { error } = await admin
    .from("newsletter_settings")
    .update({ automation_enabled: enabled, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/newsletter");
  return { success: true };
}

export async function updateNewsletterSettings(input: {
  brandNotes: string;
  featuredProductIds: string[];
  excludedProductIds: string[];
}) {
  const { admin } = await requireAdmin();
  const { error } = await admin
    .from("newsletter_settings")
    .update({
      brand_notes: input.brandNotes || null,
      featured_product_ids: input.featuredProductIds,
      excluded_product_ids: input.excludedProductIds,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/newsletter");
  return { success: true };
}

export async function generatePreview(day: "monday" | "friday" | "sunday") {
  const { admin } = await requireAdmin();
  const result = await runNewsletterCycle(admin, day, { dryRun: true });
  revalidatePath("/admin/newsletter");
  return result;
}

export async function sendDraftNow(newsletterId: string) {
  const { admin } = await requireAdmin();

  const { data: newsletter } = await admin
    .from("newsletters")
    .select("*")
    .eq("id", newsletterId)
    .single();

  if (!newsletter) return { success: false, error: "Newsletter not found" };

  try {
    const { sent, failed } = await sendNewsletterToSubscribers(admin, newsletter);
    await admin
      .from("newsletters")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", newsletterId);

    await admin.from("audit_logs").insert({
      action: "newsletter.sent_manually",
      entity_type: "newsletter",
      entity_id: newsletterId,
      metadata: { sent, failed },
    });

    revalidatePath("/admin/newsletter");
    return { success: true, sent, failed };
  } catch (err) {
    await admin
      .from("newsletters")
      .update({ status: "failed", send_error: String(err) })
      .eq("id", newsletterId);
    return { success: false, error: String(err) };
  }
}

export async function discardNewsletter(newsletterId: string) {
  const { admin } = await requireAdmin();
  const { error } = await admin.from("newsletters").delete().eq("id", newsletterId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/newsletter");
  return { success: true };
}
