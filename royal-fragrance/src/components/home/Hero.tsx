import { LinkButton } from "@/components/ui/Button";
import Image from "next/image";

export function Hero() {
  return (
    <section className="relative flex min-h-[90vh] items-center overflow-hidden bg-brand-gradient text-cream">
      {/* Ambient glow accents */}
      <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-caramel/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-sand/10 blur-[120px]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-24 lg:grid-cols-2 lg:px-8">
        <div className="animate-fade-up">
          <span className="mb-6 inline-block rounded-full border border-cream/20 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-sand">
            Royal Fragrance
          </span>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
            A Scent for Today.
            <br />
            <span className="text-caramel">A Vision for Tomorrow.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base text-cream/75 sm:text-lg">
            We currently curate exceptional fragrances for those who value
            distinction — while quietly building toward becoming an original
            perfume house with a signature scent identity of our own.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <LinkButton href="/shop" size="lg">
              Shop Fragrances
            </LinkButton>
            <LinkButton href="/about" variant="outline" size="lg">
              Explore Our Story
            </LinkButton>
          </div>
        </div>

        <div className="relative mx-auto aspect-[3/4] w-full max-w-md animate-fade-in">
          <div className="glass absolute inset-0 rounded-xl2" />
          <div className="relative h-full w-full overflow-hidden rounded-xl2">
            <Image
              src="https://images.unsplash.com/photo-1541643600914-78b084683601?w=900&q=80"
              alt="Royal Fragrance signature perfume bottle"
              fill
              priority
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
