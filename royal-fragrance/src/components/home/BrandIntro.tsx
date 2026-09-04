import { Sparkle } from "lucide-react";

export function BrandIntro() {
  return (
    <section className="bg-cream py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2 lg:px-8">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl2 bg-brand-gradient shadow-premium">
          <div className="text-center">
            <Sparkle
              className="mx-auto text-caramel/70"
              size={64}
              strokeWidth={1}
            />
            <p className="mt-4 font-display text-xl tracking-wide text-cream/70">
              Royal Fragrance
            </p>
          </div>
        </div>

        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-caramel">
            Who We Are
          </span>
          <h2 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">
            Fragrance, chosen with intention.
          </h2>
          <p className="mt-6 text-rich/80">
            Royal Fragrance began with a simple belief: a scent should feel
            like a signature, not an accessory. Every fragrance in our
            collection is carefully selected for its character, quality, and
            staying power.
          </p>
          <p className="mt-4 text-rich/80">
            We believe fragrance is memory, identity, and presence — worn
            quietly, remembered loudly. That belief shapes everything we
            curate today, and everything we intend to create tomorrow.
          </p>
        </div>
      </div>
    </section>
  );
}
