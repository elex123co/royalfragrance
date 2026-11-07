import { LinkButton } from "@/components/ui/Button";
import { getT } from "@/lib/content/server";

export async function FutureVision() {
  const t = await getT();
  const pillars = [1, 2, 3, 4].map((n) => t(`home.future.pillar${n}`));
  return (
    <section className="relative overflow-hidden bg-brand-gradient py-28 text-cream">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-caramel/30 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-sand/20 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-5 text-center lg:px-8">
        <span className="text-xs uppercase tracking-[0.2em] text-sand">
          {t("home.future.label")}
        </span>
        <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
          {t("home.future.title")}
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-cream/75">
          {t("home.future.text")}
        </p>

        <div className="mx-auto mt-12 grid max-w-2xl gap-4 sm:grid-cols-2">
          {pillars.map((pillar) => (
            <div
              key={pillar}
              className="glass rounded-xl2 px-6 py-5 text-left text-sm text-cream/90"
            >
              {pillar}
            </div>
          ))}
        </div>

        <div className="mt-12">
          <LinkButton href="/future" variant="secondary" size="lg">
            {t("home.future.btn")}
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
