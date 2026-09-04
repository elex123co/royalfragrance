import { createClient } from "@/lib/supabase/server";
import { getScentProfile, summarizeScentProfile } from "@/lib/data/account";
import { ScentProfileQuiz } from "@/components/account/ScentProfileQuiz";

export const metadata = { title: "Scent Profile — Royal Fragrance" };

export default async function ScentProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = await getScentProfile(user!.id);
  const summary = summarizeScentProfile(profile);

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl text-espresso">
        Your Scent Profile
      </h1>
      <p className="mb-6 text-sm text-rich/60">
        A few quick questions help us recommend fragrances you&rsquo;ll
        actually love.
      </p>

      {summary && (
        <div className="mb-8 rounded-xl2 bg-brand-gradient p-6 text-cream">
          <p className="text-xs uppercase tracking-widest text-sand">
            Your Profile
          </p>
          <p className="mt-2 font-display text-xl capitalize">{summary}</p>
        </div>
      )}

      <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-6">
        <ScentProfileQuiz initial={profile} />
      </div>
    </div>
  );
}
