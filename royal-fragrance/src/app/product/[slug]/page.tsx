import { notFound } from "next/navigation";
import Image from "next/image";
import { getProductBySlug, getAllProducts } from "@/lib/data/products";
import { ProductPurchasePanel } from "@/components/shop/ProductPurchasePanel";
import { ProductCard } from "@/components/ui/ProductCard";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug);
  return { title: product ? `${product.name} — Royal Fragrance` : "Product Not Found" };
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

  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-xl2 shadow-premium">
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority
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

            <ProductPurchasePanel product={product} />
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
