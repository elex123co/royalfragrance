"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types/product";
import { formatNaira } from "@/lib/utils/currency";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/Button";
import { trackMetaEvent } from "@/components/analytics/MetaPixel";
import { MessageCircle } from "lucide-react";

export function ProductPurchasePanel({
  product,
  whatsappPhone,
  newUserDiscountPercent,
}: {
  product: Product;
  whatsappPhone?: string | null;
  newUserDiscountPercent?: number | null;
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const hasVariants = (product.variants?.length ?? 0) > 0;

  const [variantId, setVariantId] = useState(product.variants?.[0]?.id);
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = product.variants?.find((v) => v.id === variantId);
  const price = selectedVariant?.price ?? product.price;
  const originalPrice = selectedVariant?.originalPrice ?? product.originalPrice;
  const outOfStock =
    product.status === "out_of_stock" ||
    (hasVariants && (selectedVariant?.stock ?? 0) <= 0);

  useEffect(() => {
    trackMetaEvent("ViewContent", {
      content_ids: [product.id],
      content_name: product.name,
      content_type: "product",
      value: price,
      currency: "NGN",
    });
    // Only fire once per product page load, not on every variant/price change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

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
    trackMetaEvent("AddToCart", {
      content_ids: [product.id],
      content_name: product.name,
      content_type: "product",
      value: price * quantity,
      currency: "NGN",
    });
  }

  function handleBuyNow() {
    addItem(buildCartItem());
    trackMetaEvent("AddToCart", {
      content_ids: [product.id],
      content_name: product.name,
      content_type: "product",
      value: price * quantity,
      currency: "NGN",
    });
    router.push("/cart");
  }

  return (
    <div className="mt-8">
      <div className="flex items-baseline gap-3">
        <p className="font-display text-2xl text-espresso">{formatNaira(price)}</p>
        {originalPrice && (
          <p className="text-base text-rich/40 line-through">{formatNaira(originalPrice)}</p>
        )}
      </div>

      {newUserDiscountPercent && !outOfStock && (
        <div className="mt-2">
          <span className="inline-block rounded-full bg-espresso px-3 py-1.5 text-sm font-bold tracking-wide text-cream shadow-sm">
            {newUserDiscountPercent}% OFF — New Customers
          </span>
          <p className="mt-1.5 text-sm text-rich/70">
            <span className="line-through text-rich/40">{formatNaira(price)}</span>{" "}
            <span className="font-bold text-red-600">
              {formatNaira(Math.round(price * (1 - newUserDiscountPercent / 100)))}
            </span>{" "}
            on your first order
          </p>
        </div>
      )}

      {product.promoTierLabel && (
        <span className="mt-2 inline-block rounded-full bg-caramel px-3 py-1.5 text-sm font-semibold text-espresso shadow-sm">
          {product.promoTierLabel}
        </span>
      )}

      {product.colors && product.colors.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs uppercase tracking-widest text-rich/50">Colors</p>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((color) => (
              <span
                key={color}
                className="rounded-full border border-espresso/15 px-3 py-1 text-xs text-espresso"
              >
                {color}
              </span>
            ))}
          </div>
        </div>
      )}

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
        {whatsappPhone && (
          <a
            href={`https://wa.me/${whatsappPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
              `Hi! I'm interested in ${product.name}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full border border-espresso/20 px-5 py-3 text-sm text-espresso hover:bg-espresso/5"
          >
            <MessageCircle size={18} /> Chat on WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
