import { sampleProducts } from "@/data/sample-products";
import { ProductCard } from "@/components/ui/ProductCard";
import { LinkButton } from "@/components/ui/Button";

export function FeaturedProducts() {
  const featured = sampleProducts.filter((p) => p.featured);

  return (
    <section className="bg-brand-100/40 py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-12 flex flex-col items-center text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-caramel">
            Best of the Collection
          </span>
          <h2 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">
            Featured Fragrances
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <LinkButton href="/shop" variant="outline" className="border-espresso/20 text-espresso hover:bg-espresso hover:text-cream">
            View All Products
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
