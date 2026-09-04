import Image from "next/image";
import { LinkButton } from "@/components/ui/Button";
import { Gem, Heart, ShieldCheck } from "lucide-react";

export const metadata = { title: "Our Story — Royal Fragrance" };

const values = [
  {
    icon: Gem,
    title: "Curated, Not Mass-Produced",
    description:
      "Every fragrance we carry is chosen for character and staying power — not just shelf appeal.",
  },
  {
    icon: Heart,
    title: "Fragrance as Identity",
    description:
      "We believe a scent should feel personal — worn quietly, remembered loudly.",
  },
  {
    icon: ShieldCheck,
    title: "Trust, Built Order by Order",
    description:
      "Secure payments, transparent pricing, and dependable delivery — every single time.",
  },
];

export default function AboutPage() {
  return (
    <section className="bg-cream">
      {/* Hero */}
      <div className="relative overflow-hidden bg-brand-gradient py-24 text-cream">
        <div className="pointer-events-none absolute -left-32 top-0 h-72 w-72 rounded-full bg-caramel/20 blur-[100px]" />
        <div className="relative mx-auto max-w-3xl px-5 text-center lg:px-8">
          <span className="text-xs uppercase tracking-[0.2em] text-sand">
            Our Story
          </span>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl">
            Fragrance, Chosen With Intention
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-cream/75">
            Royal Fragrance began with a simple belief: a scent should feel
            like a signature, not an accessory.
          </p>
        </div>
      </div>

      {/* Who we are */}
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 lg:grid-cols-2 lg:px-8">
        <div className="relative aspect-square overflow-hidden rounded-xl2 shadow-premium">
          <Image
            src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=900&q=80"
            alt="Royal Fragrance curated perfume collection"
            fill
            className="object-cover"
          />
        </div>

        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-caramel">
            Who We Are
          </span>
          <h2 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">
            More Than a Perfume Store
          </h2>
          <p className="mt-6 text-rich/80">
            We're a fragrance brand built around discovery. Rather than
            filling shelves with whatever sells fastest, we hand-select
            fragrances for their character — the oud that lingers all day,
            the musk that feels like skin, the scent that becomes someone's
            signature.
          </p>
          <p className="mt-4 text-rich/80">
            Every order is a chance to earn trust: fast, transparent
            checkout, honest delivery pricing, and a fragrance that lives up
            to its description. That's the standard we hold every product
            to, today.
          </p>
        </div>
      </div>

      {/* Why fragrance matters */}
      <div className="bg-brand-100/40 py-24">
        <div className="mx-auto max-w-4xl px-5 text-center lg:px-8">
          <span className="text-xs uppercase tracking-[0.2em] text-caramel">
            Why Fragrance Matters
          </span>
          <h2 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">
            Scent Is Memory
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-rich/80">
            Long after an outfit is forgotten, a fragrance lingers in
            memory — in a room someone just left, a hug that lasted a second
            too long, a first impression that outlasts the conversation. We
            take that seriously. It's why we obsess over what we choose to
            sell, and why we're building toward creating fragrances of our
            own.
          </p>
        </div>
      </div>

      {/* Values */}
      <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="mb-12 text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-caramel">
            What Guides Us
          </span>
          <h2 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">
            Our Values
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {values.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl2 border border-espresso/10 bg-white/50 p-6 text-center"
            >
              <Icon className="mx-auto text-caramel" size={28} />
              <h3 className="mt-4 font-display text-lg text-espresso">
                {title}
              </h3>
              <p className="mt-2 text-sm text-rich/75">{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-espresso py-20 text-center text-cream">
        <h2 className="font-display text-2xl sm:text-3xl">
          The Present Is Only the Beginning
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-cream/70">
          Read about where we're headed next as a brand.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <LinkButton href="/future" variant="secondary">
            Discover Our Vision
          </LinkButton>
          <LinkButton href="/shop" variant="outline">
            Shop Fragrances
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
