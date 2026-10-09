import Image from "next/image";
import { LinkButton } from "@/components/ui/Button";

const HERO_IMAGE_URL =
  "https://res.cloudinary.com/dtchp470a/image/upload/v1788707661/WhatsApp_Image_2026-09-06_at_16.05.36_2_wkpvtm.jpg";

export function Hero() {
  return (
    <section className="relative flex min-h-[90vh] items-center overflow-hidden text-cream">
      <Image
        src={HERO_IMAGE_URL}
        alt=""
        fill
        priority
        className="object-cover"
      />
      {/* Dark overlay so white/cream text stays readable over the photo,
          fading a little lighter toward the right where there's no text. */}
      <div className="absolute inset-0 bg-gradient-to-r from-espresso/90 via-espresso/70 to-espresso/40" />

      <div className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="max-w-xl animate-fade-up">
          <span className="mb-6 inline-block rounded-full border border-cream/20 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-sand">
            Royal Fragrance
          </span>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
            Wear the Scent of
            <br />
            <span className="text-caramel">Royalty.</span>
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
      </div>
    </section>
  );
}
