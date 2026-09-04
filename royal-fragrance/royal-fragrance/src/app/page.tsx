import { Hero } from "@/components/home/Hero";
import { BrandIntro } from "@/components/home/BrandIntro";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { FutureVision } from "@/components/home/FutureVision";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { BecomeVendor } from "@/components/home/BecomeVendor";
import { Testimonials } from "@/components/home/Testimonials";
import { Newsletter } from "@/components/home/Newsletter";

export default function HomePage() {
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
      <Newsletter />
    </>
  );
}
