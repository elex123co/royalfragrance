"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types/product";
import { formatNaira } from "@/lib/utils/currency";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/Button";

export function ProductPurchasePanel({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const hasVariants = (product.variants?.length ?? 0) > 0;

  const [variantId, setVariantId] = useState(product.variants?.[0]?.id);
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = product.variants?.find((v) => v.id === variantId);
  const price = selectedVariant?.price ?? product.price;
  const outOfStock =
    product.status === "out_of_stock" ||
    (hasVariants && (selectedVariant?.stock ?? 0) <= 0);

  function buildCartItem() {
    return {
      productId: product.id,
      variantId: selectedVariant?.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      size: selectedVariant?.size,
      price,
      quantity,
    };
  }

  function handleAddToCart() {
    addItem(buildCartItem());
  }

  function handleBuyNow() {
    addItem(buildCartItem());
    router.push("/cart");
  }

  return (
    <div className="mt-8">
      <p className="font-display text-2xl text-espresso">{formatNaira(price)}</p>

      {hasVariants && (
        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-espresso">Size</p>
          <div className="flex flex-wrap gap-2">
            {product.variants!.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariantId(v.id)}
                disabled={v.stock <= 0}
                className={`rounded-full border px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  variantId === v.id
                    ? "border-espresso bg-espresso text-cream"
                    : "border-espresso/20 text-espresso hover:border-espresso"
                }`}
              >
                {v.size}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center gap-4">
        <div className="flex items-center rounded-full border border-espresso/20">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-2 text-espresso"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-8 text-center text-sm">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="px-3 py-2 text-espresso"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        {outOfStock ? (
          <span className="text-sm text-rich/60">Currently out of stock</span>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={handleAddToCart}
          disabled={outOfStock}
        >
          Add to Cart
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={handleBuyNow}
          disabled={outOfStock}
        >
          Buy Now
        </Button>
      </div>
    </div>
  );
}
