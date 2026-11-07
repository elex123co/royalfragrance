import Image from "next/image";
import { LinkButton } from "@/components/ui/Button";
import { Gem, Heart, ShieldCheck } from "lucide-react";
import { getT } from "@/lib/content/server";

export async function generateMetadata() {
  const t = await getT();
  return {
    title: t("about.meta.title"),
    description: t("about.meta.desc"),
    alternates: { canonical: "https://royalfragrancegallery.com/about" },
  };
}

export const dynamic = "force-dynamic";

const valueIcons = [Gem, Heart, ShieldCheck];

export default async function AboutPage() {
  const t = await getT();
  const values = valueIcons.map((icon, i) => ({
    icon,
    title: t(`about.values.${i + 1}.title`),
    description: t(`about.values.${i + 1}.text`),
  }));
  return (
    <section className="bg-cream">
      {/* Hero */}
      <div className="relative overflow-hidden bg-brand-gradient py-24 text-cream">
        <div className="pointer-events-none absolute -left-32 top-0 h-72 w-72 rounded-full bg-caramel/20 blur-[100px]" />
        <div className="relative mx-auto max-w-3xl px-5 text-center lg:px-8">
          <span className="text-xs uppercase tracking-[0.2em] text-sand">
            {t("about.hero.label")}
          </span>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl">
            {t("about.hero.title")}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-cream/75">
            {t("about.hero.text")}
          </p>
        </div>
      </div>

      {/* Who we are */}
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 lg:grid-cols-2 lg:px-8">
        <div className="relative aspect-square overflow-hidden rounded-xl2 shadow-premium">
          <Image
            src="https://res.cloudinary.com/dtchp470a/image/upload/v1788708302/WhatsApp_Image_2026-09-06_at_16.24.36_k3guta.jpg"
            alt="Royal Fragrance — curated collection"
            fill
            className="object-cover"
          />
        </div>

        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-caramel">
            {t("about.who.label")}
          </span>
          <h2 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">
            {t("about.who.title")}
          </h2>
          <p className="mt-6 text-rich/80">{t("about.who.p1")}</p>
          <p className="mt-4 text-rich/80">{t("about.who.p2")}</p>
        </div>
      </div>

      {/* Why fragrance matters */}
      <div className="bg-brand-100/40 py-24">
        <div className="mx-auto max-w-4xl px-5 text-center lg:px-8">
          <span className="text-xs uppercase tracking-[0.2em] text-caramel">
            {t("about.matters.label")}
          </span>
          <h2 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">
            {t("about.matters.title")}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-rich/80">
            {t("about.matters.text")}
          </p>
        </div>
      </div>

      {/* Values */}
      <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="mb-12 text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-caramel">
            {t("about.values.label")}
          </span>
          <h2 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">
            {t("about.values.title")}
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
          {t("about.cta.title")}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-cream/70">
          {t("about.cta.text")}
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <LinkButton href="/future" variant="secondary">
            {t("about.cta.btn1")}
          </LinkButton>
          <LinkButton href="/shop" variant="outline">
            {t("about.cta.btn2")}
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
