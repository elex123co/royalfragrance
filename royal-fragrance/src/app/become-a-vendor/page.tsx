import { VendorInterestForm } from "@/components/vendor/VendorInterestForm";
import { getBrandWhatsAppLink } from "@/lib/data/whatsapp";
import { Wallet, PackageCheck, LineChart, Users, Percent } from "lucide-react";
import { getT } from "@/lib/content/server";

export async function generateMetadata() {
  const t = await getT();
  return {
    title: t("vendorpage.meta.title"),
    description: t("vendorpage.meta.desc"),
    alternates: { canonical: "https://royalfragrancegallery.com/become-a-vendor" },
  };
}

const perkIcons = [Percent, Wallet, LineChart, PackageCheck, Users];

export const dynamic = "force-dynamic";

export default async function BecomeVendorPage() {
  const t = await getT();
  const perks = perkIcons.map((icon, i) => ({
    icon,
    title: t(`vendorpage.perk${i + 1}.title`),
    description: t(`vendorpage.perk${i + 1}.text`),
  }));
  const whatsappLink = await getBrandWhatsAppLink(
    "Hello Royal Fragrance, I have a question about becoming a vendor."
  );
  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="mb-14 text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-caramel">
            {t("vendorpage.label")}
          </span>
          <h1 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">
            {t("vendorpage.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-rich/70">
            {t("vendorpage.text")}
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              {perks.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-xl2 border border-espresso/10 bg-white/50 p-5"
                >
                  <Icon className="text-caramel" size={22} />
                  <h3 className="mt-3 font-display text-base text-espresso">
                    {title}
                  </h3>
                  <p className="mt-1 text-sm text-rich/70">{description}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-sm text-rich/60">
              {t("vendorpage.review")}
            </p>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block rounded-full border border-espresso/20 px-5 py-2.5 text-sm text-espresso hover:bg-espresso/5"
            >
              {t("vendorpage.whatsapp")}
            </a>
          </div>

          <VendorInterestForm />
        </div>
      </div>
    </section>
  );
}
