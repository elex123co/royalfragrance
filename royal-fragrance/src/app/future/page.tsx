import { LinkButton } from "@/components/ui/Button";
import { FlaskConical, Sparkles, Fingerprint, Rocket } from "lucide-react";
import { getT } from "@/lib/content/server";

export async function generateMetadata() {
  const t = await getT();
  return {
    title: t("future.meta.title"),
    description: t("future.meta.desc"),
    alternates: { canonical: "https://royalfragrancegallery.com/future" },
  };
}

export const dynamic = "force-dynamic";

const milestoneIcons = [FlaskConical, Sparkles, Fingerprint, Rocket];

export default async function FuturePage() {
  const t = await getT();
  const milestones = milestoneIcons.map((icon, i) => ({
    icon,
    title: t(`future.road.${i + 1}.title`),
    description: t(`future.road.${i + 1}.text`),
  }));
  return (
    <section className="bg-cream">
      {/* Hero */}
      <div className="relative overflow-hidden bg-brand-gradient py-28 text-cream">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-caramel/30 blur-[110px]" />
          <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-sand/20 blur-[110px]" />
        </div>

        <div className="relative mx-auto max-w-3xl px-5 text-center lg:px-8">
          <span className="text-xs uppercase tracking-[0.2em] text-sand">
            {t("future.hero.label")}
          </span>
          <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
            {t("future.hero.title")}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-cream/75">
            {t("future.hero.text")}
          </p>
        </div>
      </div>

      {/* Why we're building this way */}
      <div className="mx-auto max-w-4xl px-5 py-24 text-center lg:px-8">
        <span className="text-xs uppercase tracking-[0.2em] text-caramel">
          {t("future.why.label")}
        </span>
        <h2 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">
          {t("future.why.title")}
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-rich/80">
          {t("future.why.text")}
        </p>
      </div>

      {/* Milestones */}
      <div className="bg-brand-100/40 py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mb-12 text-center">
            <span className="text-xs uppercase tracking-[0.2em] text-caramel">
              {t("future.road.label")}
            </span>
            <h2 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">
              {t("future.road.title")}
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {milestones.map(({ icon: Icon, title, description }, i) => (
              <div
                key={title}
                className="flex gap-4 rounded-xl2 border border-espresso/10 bg-white/60 p-6"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-espresso text-cream">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-caramel">
                    {t("future.road.chapter")} {i + 1}
                  </p>
                  <h3 className="mt-1 font-display text-lg text-espresso">
                    {title}
                  </h3>
                  <p className="mt-1 text-sm text-rich/75">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invitation */}
      <div className="bg-espresso py-24 text-center text-cream">
        <span className="text-xs uppercase tracking-[0.2em] text-sand">
          {t("future.join.label")}
        </span>
        <h2 className="mx-auto mt-3 max-w-xl font-display text-3xl sm:text-4xl">
          {t("future.join.title")}
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm text-cream/70">
          {t("future.join.text")}
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <LinkButton href="/shop" variant="secondary">
            {t("future.join.btn1")}
          </LinkButton>
          <LinkButton href="/become-a-vendor" variant="outline">
            {t("future.join.btn2")}
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
