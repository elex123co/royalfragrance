"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/types/product";
import { formatNaira } from "@/lib/utils/currency";
import { useCart } from "@/context/CartContext";
import { BrandImage } from "@/components/ui/BrandImage";

export function ProductCard({ product }: { product: Product }) {
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
      className="group flex flex-col overflow-hidden rounded-2xl border border-espresso/10 bg-white/70 shadow-premium-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-premium"
    >
      <div className="relative aspect-square overflow-hidden bg-brand-100 sm:aspect-[4/5]">
        <BrandImage
          src={product.image}
          alt={product.name}
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {outOfStock && (
          <span className="absolute left-3 top-3 rounded-full bg-espresso/90 px-3 py-1 text-xs tracking-wide text-cream">
            Out of Stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4 sm:p-5">
        <span className="text-[11px] uppercase tracking-widest text-caramel">
          {product.category}
        </span>
        <h3 className="font-display text-base leading-snug text-espresso sm:text-lg">
          {product.name}
        </h3>
        <p className="line-clamp-2 text-xs text-rich/70 sm:text-sm">
          {product.shortDescription}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <span className="font-display text-base text-espresso sm:text-lg">
            {formatNaira(product.price)}
          </span>
        </div>

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
