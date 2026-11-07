import Image from "next/image";
import { getT } from "@/lib/content/server";

const WHO_WE_ARE_IMAGE_URL =
  "https://res.cloudinary.com/dtchp470a/image/upload/v1788708302/WhatsApp_Image_2026-09-06_at_16.24.36_k3guta.jpg";

export async function BrandIntro() { const _t = await getT();
  const t = await getT();
  return (
    <section className="bg-cream py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2 lg:px-8">
        <div className="relative aspect-square overflow-hidden rounded-xl2 shadow-premium">
          <Image
            src={WHO_WE_ARE_IMAGE_URL}
            alt={_t("home.brandintro.6979d6", "Royal Fragrance — curated collection")}
            fill
            className="object-cover"
          />
        </div>

        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-caramel">
            {t("home.intro.label")}
          </span>
          <h2 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">
            {t("home.intro.title")}
          </h2>
          <p className="mt-6 text-rich/80">{t("home.intro.p1")}</p>
          <p className="mt-4 text-rich/80">{t("home.intro.p2")}</p>
        </div>
      </div>
    </section>
  );
}
