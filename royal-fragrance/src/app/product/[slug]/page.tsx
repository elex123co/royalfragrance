import { notFound } from "next/navigation";
import { getProductBySlug, getAllProducts } from "@/lib/data/products";
import { ProductPurchasePanel } from "@/components/shop/ProductPurchasePanel";
import { ProductCard } from "@/components/ui/ProductCard";
import { BrandImage } from "@/components/ui/BrandImage";
import { WishlistToggle } from "@/components/shop/WishlistToggle";
import { createClient } from "@/lib/supabase/server";
import { isWishlisted } from "@/lib/data/account";

const SITE_URL = "https://royalfragrancegallery.com";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Product Not Found" };

  const description =
    product.shortDescription ||
    product.description?.slice(0, 155) ||
    `Shop ${product.name} — a ${product.category.toLowerCase()} fragrance from Royal Fragrance.`;

  return {
    title: product.name,
    description,
    alternates: { canonical: `${SITE_URL}/product/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      url: `${SITE_URL}/product/${product.slug}`,
      images: product.image ? [{ url: product.image, width: 800, height: 800, alt: product.name }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: product.image ? [product.image] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const all = await getAllProducts();
  const related = all
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const wishlisted = user ? await isWishlisted(user.id, product.id) : false;

  const lowestPrice = product.variants?.length
    ? Math.min(...product.variants.map((v) => v.price))
    : product.price;
  const inStock =
    product.status === "active" &&
    (!product.variants?.length || product.variants.some((v) => v.stock > 0));

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.shortDescription,
    image: product.image ? [product.image] : undefined,
    category: product.category,
    brand: { "@type": "Brand", name: "Royal Fragrance" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${product.slug}`,
      priceCurrency: "NGN",
      price: lowestPrice,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <section className="bg-cream py-16">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-xl2 shadow-premium">
            <BrandImage
              src={product.image}
              alt={product.name}
              className="object-cover"
            />
          </div>

          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-caramel">
              {product.category}
            </span>
            <h1 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-4 text-rich/80">{product.description}</p>

            {product.notes && (
              <div className="mt-6 grid grid-cols-3 gap-4 rounded-xl2 border border-espresso/10 bg-white/50 p-5 text-sm">
                {product.notes.top && (
                  <div>
                    <p className="font-display text-espresso">Top</p>
                    <p className="mt-1 text-rich/70">
                      {product.notes.top.join(", ")}
                    </p>
                  </div>
                )}
                {product.notes.heart && (
                  <div>
                    <p className="font-display text-espresso">Heart</p>
                    <p className="mt-1 text-rich/70">
                      {product.notes.heart.join(", ")}
                    </p>
                  </div>
                )}
                {product.notes.base && (
                  <div>
                    <p className="font-display text-espresso">Base</p>
                    <p className="mt-1 text-rich/70">
                      {product.notes.base.join(", ")}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="flex-1">
                <ProductPurchasePanel product={product} />
              </div>
              <div className="mt-8">
                <WishlistToggle
                  productId={product.id}
                  initialWishlisted={wishlisted}
                  isLoggedIn={!!user}
                />
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-24">
            <h2 className="mb-8 font-display text-2xl text-espresso">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
