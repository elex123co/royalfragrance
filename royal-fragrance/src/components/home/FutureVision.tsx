import { LinkButton } from "@/components/ui/Button";

const pillars = [
  "Creating original fragrances",
  "Developing signature scents",
  "Experimenting with fragrance concepts",
  "Building a recognizable perfume identity",
];

export function FutureVision() {
  return (
    <section className="relative overflow-hidden bg-brand-gradient py-28 text-cream">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-caramel/30 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-sand/20 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-5 text-center lg:px-8">
        <span className="text-xs uppercase tracking-[0.2em] text-sand">
          The Future of Royal Fragrance
        </span>
        <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
          The Future Smells Different.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-cream/75">
          We are not just building a store — we are building toward becoming
          an original fragrance house. Every product we curate today informs
          the scents we intend to create tomorrow.
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
            Discover Our Vision
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
