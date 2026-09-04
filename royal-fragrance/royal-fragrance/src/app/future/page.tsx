import { LinkButton } from "@/components/ui/Button";
import { FlaskConical, Sparkles, Fingerprint, Rocket } from "lucide-react";

export const metadata = { title: "The Future of Royal Fragrance" };

const milestones = [
  {
    icon: FlaskConical,
    title: "Developing Original Fragrances",
    description:
      "Moving from curating others' work to formulating scents of our own — from concept to bottle.",
  },
  {
    icon: Sparkles,
    title: "Signature Scent Collections",
    description:
      "Building a line that's unmistakably Royal Fragrance — not a copy of what already exists.",
  },
  {
    icon: Fingerprint,
    title: "A Recognizable Identity",
    description:
      "A brand you can identify by scent alone, the way perfume houses earn a following over decades.",
  },
  {
    icon: Rocket,
    title: "Beyond Retail",
    description:
      "From reselling exceptional fragrances to producing them — becoming a fragrance house in our own right.",
  },
];

export default function FuturePage() {
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
            The Future of Royal Fragrance
          </span>
          <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
            The Future Smells Different.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-cream/75">
            We didn't set out to just sell fragrances. We set out to build a
            fragrance house — and today's collection is only the first
            chapter.
          </p>
        </div>
      </div>

      {/* Why we're building this way */}
      <div className="mx-auto max-w-4xl px-5 py-24 text-center lg:px-8">
        <span className="text-xs uppercase tracking-[0.2em] text-caramel">
          Why We Started Here
        </span>
        <h2 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">
          Curation Before Creation
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-rich/80">
          Every great fragrance house started by understanding what makes a
          scent unforgettable. That's what curating exceptional fragrances
          has taught us — what people respond to, what they wear again and
          again, and what they specifically ask us for more of. That
          knowledge is the foundation we're building an original perfume
          line on top of.
        </p>
      </div>

      {/* Milestones */}
      <div className="bg-brand-100/40 py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mb-12 text-center">
            <span className="text-xs uppercase tracking-[0.2em] text-caramel">
              Where We're Headed
            </span>
            <h2 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">
              The Road Ahead
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
                    Chapter {i + 1}
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
          Be Part of It
        </span>
        <h2 className="mx-auto mt-3 max-w-xl font-display text-3xl sm:text-4xl">
          Join Us From the Beginning
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm text-cream/70">
          Every fragrance you buy today shapes what we create tomorrow.
          Subscribe for updates, or become a vendor and grow alongside us.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <LinkButton href="/shop" variant="secondary">
            Shop the Collection
          </LinkButton>
          <LinkButton href="/become-a-vendor" variant="outline">
            Become a Vendor
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
