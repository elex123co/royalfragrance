import { Sparkles, ShieldCheck, Truck, TrendingUp, Gem } from "lucide-react";
import { getT } from "@/lib/content/server";

const icons = [Gem, Sparkles, ShieldCheck, Truck, TrendingUp];

export async function WhyChooseUs() {
  const t = await getT();
  const items = icons.map((icon, i) => ({
    icon,
    title: t(`home.why.${i + 1}.title`),
    description: t(`home.why.${i + 1}.text`),
  }));
  return (
    <section className="bg-cream py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-12 text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-caramel">
            {t("home.why.label")}
          </span>
          <h2 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">
            {t("home.why.title")}
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {items.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl2 border border-espresso/10 bg-white/50 p-6 shadow-premium-sm transition hover:-translate-y-1 hover:shadow-premium"
            >
              <Icon className="text-caramel" size={28} />
              <h3 className="mt-4 font-display text-lg text-espresso">
                {title}
              </h3>
              <p className="mt-2 text-sm text-rich/75">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
