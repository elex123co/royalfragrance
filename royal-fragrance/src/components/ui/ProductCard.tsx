import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types/product";
import { formatNaira } from "@/lib/utils/currency";

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl2 bg-white/60 shadow-premium-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-premium">
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden bg-brand-100"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {product.status === "out_of_stock" && (
          <span className="absolute left-3 top-3 rounded-full bg-espresso/90 px-3 py-1 text-xs tracking-wide text-cream">
            Out of Stock
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className="text-xs uppercase tracking-widest text-caramel">
          {product.category}
        </span>
        <h3 className="font-display text-lg text-espresso">
          {product.name}
        </h3>
        <p className="line-clamp-2 text-sm text-rich/80">
          {product.shortDescription}
        </p>

        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="font-display text-lg text-espresso">
            {formatNaira(product.price)}
          </span>
          <div className="flex gap-2">
            <Link
              href={`/product/${product.slug}`}
              className="rounded-full border border-espresso/20 px-3 py-1.5 text-xs font-medium text-espresso transition hover:bg-espresso hover:text-cream"
            >
              View
            </Link>
            <button
              type="button"
              className="rounded-full bg-espresso px-3 py-1.5 text-xs font-medium text-cream transition hover:bg-rich"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
