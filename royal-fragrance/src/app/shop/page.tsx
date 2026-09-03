import { Suspense } from "react";
import { getAllProducts } from "@/lib/data/products";
import { categories } from "@/data/sample-products";
import { ProductCard } from "@/components/ui/ProductCard";
import { ShopFilters } from "@/components/shop/ShopFilters";

export const metadata = { title: "Shop — Royal Fragrance" };

interface ShopPageProps {
  searchParams: {
    q?: string;
    category?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const allProducts = await getAllProducts();

  let filtered = allProducts;

  if (searchParams.q) {
    const q = searchParams.q.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q)
    );
  }

  if (searchParams.category) {
    filtered = filtered.filter(
      (p) => p.category.toLowerCase() === searchParams.category!.toLowerCase()
    );
  }

  if (searchParams.minPrice) {
    filtered = filtered.filter((p) => p.price >= Number(searchParams.minPrice));
  }
  if (searchParams.maxPrice) {
    filtered = filtered.filter((p) => p.price <= Number(searchParams.maxPrice));
  }

  switch (searchParams.sort) {
    case "price-asc":
      filtered = [...filtered].sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      filtered = [...filtered].sort((a, b) => b.price - a.price);
      break;
    case "name":
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      break; // newest first (default order from query)
  }

  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-10 text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-caramel">
            The Collection
          </span>
          <h1 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">
            Shop All Fragrances
          </h1>
        </div>

        <Suspense fallback={null}>
          <ShopFilters categories={categories} />
        </Suspense>

        {filtered.length === 0 ? (
          <p className="mt-16 text-center text-rich/60">
            No fragrances match your filters. Try adjusting your search.
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
