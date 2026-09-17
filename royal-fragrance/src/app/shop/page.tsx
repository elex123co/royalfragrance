import { Suspense } from "react";
import { getAllProducts } from "@/lib/data/products";
import { getCategories } from "@/lib/data/categories";
import { getActiveNewUserDiscountPercent } from "@/lib/data/new-user-discount";
import { ProductCard } from "@/components/ui/ProductCard";
import { ShopFilters } from "@/components/shop/ShopFilters";
import { Pagination } from "@/components/shop/Pagination";

const PRODUCTS_PER_PAGE = 20;

export const metadata = {
  title: "Shop",
  description:
    "Browse Royal Fragrance's full collection — Men's, Women's, Unisex, and Oud fragrances. Shop premium perfumes online across Nigeria with secure checkout and fast delivery.",
  alternates: { canonical: "https://royalfragrancegallery.com/shop" },
};

// Always fetch live data — pricing, stock, and discounts change constantly,
// and a stale build-time snapshot would show outdated products.
export const dynamic = "force-dynamic";

interface ShopPageProps {
  searchParams: {
    q?: string;
    category?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const [allProducts, realCategories, newUserDiscountPercent] = await Promise.all([
    getAllProducts(),
    getCategories(),
    getActiveNewUserDiscountPercent(),
  ]);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(totalPages, Math.max(1, Number(searchParams.page) || 1));
  const pageStart = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const pageItems = filtered.slice(pageStart, pageStart + PRODUCTS_PER_PAGE);

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
          <ShopFilters categories={realCategories.map((c) => c.name)} />
        </Suspense>

        {filtered.length === 0 ? (
          <p className="mt-16 text-center text-rich/60">
            No fragrances match your filters. Try adjusting your search.
          </p>
        ) : (
          <>
            <div className="mt-10 grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-4">
              {pageItems.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  newUserDiscountPercent={newUserDiscountPercent}
                />
              ))}
            </div>
            <Suspense fallback={null}>
              <Pagination currentPage={currentPage} totalPages={totalPages} />
            </Suspense>
          </>
        )}
      </div>
    </section>
  );
}
