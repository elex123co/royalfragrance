import { createAdminClient } from "@/lib/supabase/server";
import { NewsletterAdminPanel } from "@/components/admin/NewsletterAdminPanel";

// Always fetch live data — admin dashboards must never serve a stale build-time snapshot.
export const dynamic = "force-dynamic";

export const metadata = { title: "Newsletter — Admin — Royal Fragrance" };

export default async function AdminNewsletterPage() {
  const supabase = createAdminClient();

  const [{ data: settings }, { data: products }, { data: history }, { data: activeStoryline }] =
    await Promise.all([
      supabase.from("newsletter_settings").select("*").eq("id", 1).single(),
      supabase.from("products").select("id, name").eq("status", "active").order("name"),
      supabase
        .from("newsletters")
        .select("*")
        .order("generated_at", { ascending: false })
        .limit(20),
      supabase
        .from("storylines")
        .select("*, story_characters(name)")
        .eq("status", "active")
        .maybeSingle(),
    ]);

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl text-espresso">
        Elizabeth — Newsletter Engine
      </h1>
      <p className="mb-6 text-sm text-rich/60">
        Autonomous newsletters every Monday, Friday, and Sunday.
      </p>

      <NewsletterAdminPanel
        settings={settings}
        products={products ?? []}
        history={history ?? []}
        activeStoryline={activeStoryline}
      />
    </div>
  );
}
