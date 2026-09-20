import Link from "next/link";
import type { Product } from "@/lib/types/product";
import { formatNaira } from "@/lib/utils/currency";
import { discountLabel } from "@/lib/utils/discount";
import { BrandImage } from "@/components/ui/BrandImage";

export function ProductCard({
  product,
  newUserDiscountPercent,
}: {
  product: Product;
  newUserDiscountPercent?: number | null;
}) {
  const outOfStock = product.status === "out_of_stock";

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block overflow-hidden rounded-2xl border border-espresso/10 bg-white shadow-premium-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-premium"
    >
      <div className="relative aspect-square overflow-hidden bg-brand-100">
        <BrandImage
          src={product.image}
          alt={product.name}
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/10" />

        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {outOfStock && (
            <span className="rounded-full bg-espresso/90 px-3 py-1 text-xs tracking-wide text-cream">
              Out of Stock
            </span>
          )}
          {product.originalPrice && !outOfStock && (
            <span className="rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-medium tracking-wide text-white shadow-sm">
              {discountLabel(product.discountType ?? null, product.discountValue) ?? "Sale"}
            </span>
          )}
          {newUserDiscountPercent && !outOfStock && (
            <span className="rounded-full bg-espresso px-2.5 py-1 text-[11px] font-bold tracking-wide text-cream shadow-sm">
              {newUserDiscountPercent}% OFF
            </span>
          )}
        </div>

        {/* Name + price sit directly on the image as a bottom overlay,
            keeping the card a true square instead of stretching it with
            a separate text block underneath. */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-6">
          <p className="truncate text-sm font-medium text-white">{product.name}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-sm text-white">{formatNaira(product.price)}</span>
            {product.originalPrice && (
              <span className="text-xs text-white/60 line-through">
                {formatNaira(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
