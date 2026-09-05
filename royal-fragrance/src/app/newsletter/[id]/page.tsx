import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";

export default async function NewsletterReadPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { voted?: string };
}) {
  const supabase = createAdminClient();
  const { data: newsletter } = await supabase
    .from("newsletters")
    .select("*")
    .eq("id", params.id)
    .eq("status", "sent")
    .maybeSingle();

  if (!newsletter) notFound();

  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-2xl px-5 lg:px-8">
        {searchParams.voted && searchParams.voted !== "error" && (
          <div className="mb-6 rounded-xl2 bg-caramel/15 px-5 py-3 text-sm text-espresso">
            Thanks for voting — your choice ({searchParams.voted}) has been counted. 👑
          </div>
        )}

        <span className="text-xs uppercase tracking-[0.2em] text-caramel">
          Royal Fragrance
        </span>
        <h1 className="mt-2 font-display text-3xl text-espresso">{newsletter.title}</h1>

        <div
          className="prose prose-sm mt-8 max-w-none text-rich/90"
          dangerouslySetInnerHTML={{ __html: newsletter.content }}
        />

        {newsletter.is_interactive && newsletter.interactive_choices && !searchParams.voted && (
          <div className="mt-8 rounded-xl2 bg-white/60 p-6">
            <p className="mb-3 font-medium text-espresso">
              {newsletter.interactive_question}
            </p>
            <p className="text-sm text-rich/60">
              Vote from the email you received — this page shows the story, but votes
              are tallied from your subscriber email link.
            </p>
          </div>
        )}

        <p className="mt-10 text-sm text-rich/60">
          Until next time,
          <br />
          Elizabeth 👑
        </p>
      </div>
    </section>
  );
}
