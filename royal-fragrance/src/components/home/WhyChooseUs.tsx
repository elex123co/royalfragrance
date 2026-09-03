import { Sparkles, ShieldCheck, Truck, TrendingUp, Gem } from "lucide-react";

const items = [
  {
    icon: Gem,
    title: "Carefully Selected Fragrances",
    description:
      "Every fragrance is chosen for character, quality, and lasting impression.",
  },
  {
    icon: Sparkles,
    title: "Premium Customer Experience",
    description:
      "From browsing to unboxing, every touchpoint is crafted to feel elevated.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Ordering",
    description:
      "Payments are processed securely with verified, server-side confirmation.",
  },
  {
    icon: Truck,
    title: "Reliable Delivery",
    description:
      "Transparent delivery pricing and dependable fulfillment, every time.",
  },
  {
    icon: TrendingUp,
    title: "Growing Fragrance Innovation",
    description:
      "We're building toward original, signature fragrances made by us.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="bg-cream py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-12 text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-caramel">
            Why Royal Fragrance
          </span>
          <h2 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">
            Built on Trust and Craft
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
