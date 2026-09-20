"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/types/product";
import { formatNaira } from "@/lib/utils/currency";
import { discountLabel } from "@/lib/utils/discount";
import { useCart } from "@/context/CartContext";
import { BrandImage } from "@/components/ui/BrandImage";

export function ProductCard({
  product,
  newUserDiscountPercent,
}: {
  product: Product;
  newUserDiscountPercent?: number | null;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const outOfStock = product.status === "out_of_stock";

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-espresso/10 bg-white shadow-premium-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-premium"
    >
      <div className="relative aspect-square overflow-hidden bg-brand-100 sm:aspect-[4/5]">
        <BrandImage
          src={product.image}
          alt={product.name}
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        {/* Subtle gloss gradient for a more premium, polished card. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/10" />
        {outOfStock && (
          <span className="absolute left-3 top-3 rounded-full bg-espresso/90 px-3 py-1 text-xs tracking-wide text-cream">
            Out of Stock
          </span>
        )}
        {product.originalPrice && !outOfStock && (
          <span className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-medium tracking-wide text-white shadow-sm">
            {discountLabel(product.discountType ?? null, product.discountValue) ?? "Sale"}
          </span>
        )}
        {newUserDiscountPercent && !outOfStock && (
          <span className="absolute bottom-3 left-3 rounded-full bg-espresso px-3 py-1 text-xs font-bold tracking-wide text-cream shadow-sm">
            {newUserDiscountPercent}% OFF — New Customers
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4 sm:p-5">
        <h3 className="font-display text-base leading-snug text-espresso sm:text-lg">
          {product.name}
        </h3>

        <div className="mt-3 flex items-center gap-2 justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-base text-espresso sm:text-lg">
              {formatNaira(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-rich/40 line-through">
                {formatNaira(product.originalPrice)}
              </span>
            )}
          </div>
        </div>

        {newUserDiscountPercent && !outOfStock && (
          <p className="text-xs font-bold text-red-600">
            New customers: <span className="line-through text-rich/40 font-normal">{formatNaira(product.price)}</span>{" "}
            {formatNaira(Math.round(product.price * (1 - newUserDiscountPercent / 100)))} ({newUserDiscountPercent}% off)
          </p>
        )}

        {product.promoTierLabel && (
          <p className="text-xs font-semibold text-caramel">
            {product.promoTierLabel}
          </p>
        )}

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={outOfStock}
          className="mt-3 w-full rounded-full bg-espresso py-2.5 text-xs font-medium text-cream transition hover:bg-rich disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
        >
          {outOfStock ? "Out of Stock" : added ? "Added ✓" : "Add to Cart"}
        </button>
      </div>
    </Link>
  );
}
