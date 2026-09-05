import type { SupabaseClient } from "@supabase/supabase-js";
import type { DecisionContext } from "./types";

export async function gatherContext(
  supabase: SupabaseClient,
  dayOfWeek: DecisionContext["dayOfWeek"]
): Promise<DecisionContext> {
  const [{ data: recent }, { data: activeStoryline }, { data: settings }] = await Promise.all([
    supabase
      .from("newsletters")
      .select("content_type, title, content, generated_at")
      .eq("status", "sent")
      .order("generated_at", { ascending: false })
      .limit(8),
    supabase
      .from("storylines")
      .select("id, title, summary, current_episode, last_updated_at, story_characters(name, description, personality)")
      .eq("status", "active")
      .order("last_updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("newsletter_settings").select("*").eq("id", 1).single(),
  ]);

  // Was the most recent interactive newsletter's vote ever resolved? If so,
  // surface the result so Elizabeth can reference it ("you all chose...").
  let pendingVoteResult: DecisionContext["pendingVoteResult"] = null;
  const { data: lastInteractive } = await supabase
    .from("newsletters")
    .select("id, interactive_question, winning_choice")
    .eq("status", "sent")
    .eq("is_interactive", true)
    .is("winning_choice", null)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastInteractive) {
    const { data: votes } = await supabase
      .from("newsletter_votes")
      .select("choice")
      .eq("newsletter_id", lastInteractive.id);

    if (votes && votes.length > 0) {
      const tally = new Map<string, number>();
      for (const v of votes) tally.set(v.choice, (tally.get(v.choice) ?? 0) + 1);
      const winner = [...tally.entries()].sort((a, b) => b[1] - a[1])[0][0];

      await supabase
        .from("newsletters")
        .update({ winning_choice: winner })
        .eq("id", lastInteractive.id);

      pendingVoteResult = {
        newsletterId: lastInteractive.id,
        question: lastInteractive.interactive_question ?? "",
        winningChoice: winner,
      };
    }
  }

  const featuredIds: string[] = settings?.featured_product_ids ?? [];
  const excludedIds: string[] = settings?.excluded_product_ids ?? [];

  let featuredProducts: DecisionContext["featuredProducts"] = [];
  if (featuredIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id, name, base_price, short_description, categories(name)")
      .in("id", featuredIds)
      .eq("status", "active");
    featuredProducts = (products ?? []).map((p: any) => ({
      id: p.id,
      name: p.name,
      category: p.categories?.name ?? "Fragrance",
      price: Number(p.base_price),
      shortDescription: p.short_description ?? "",
    }));
  }

  return {
    dayOfWeek,
    recentNewsletters: recent ?? [],
    activeStoryline: activeStoryline
      ? {
          id: activeStoryline.id,
          title: activeStoryline.title,
          summary: activeStoryline.summary,
          current_episode: activeStoryline.current_episode,
          last_updated_at: activeStoryline.last_updated_at,
          characters: (activeStoryline as any).story_characters ?? [],
        }
      : null,
    pendingVoteResult,
    featuredProducts,
    excludedProductIds: excludedIds,
    brandNotes: settings?.brand_notes ?? null,
  };
}
