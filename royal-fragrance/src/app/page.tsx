import { Hero } from "@/components/home/Hero";
import { BrandIntro } from "@/components/home/BrandIntro";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { FutureVision } from "@/components/home/FutureVision";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { BecomeVendor } from "@/components/home/BecomeVendor";
import { Testimonials } from "@/components/home/Testimonials";
import { Newsletter } from "@/components/home/Newsletter";
import { getT } from "@/lib/content/server";

// Always fetch live data — FeaturedProducts reads pricing/discount
// settings that can change at any time, and a stale cached homepage
// would show outdated prices/badges.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const t = await getT();
  return (
    <>
      <Hero />
      <BrandIntro />
      <FeaturedProducts />
      <FutureVision />
      <WhyChooseUs />
      <BecomeVendor />
      {/* Populated from Supabase `testimonials` table via admin dashboard */}
      <Testimonials testimonials={[]} />
      <Newsletter
        texts={{
          title: t("home.news.title"),
          text: t("home.news.text"),
          placeholder: t("home.news.placeholder"),
          btn: t("home.news.btn"),
          success: t("home.news.success"),
          error: t("home.news.error"),
        }}
      />
    </>
  );
}
