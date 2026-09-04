"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatNaira } from "@/lib/utils/currency";
import { LinkButton } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-32 text-center lg:px-8">
        <h1 className="font-display text-3xl text-espresso">Your Cart is Empty</h1>
        <p className="mt-3 text-rich/70">
          Discover a fragrance that feels like you.
        </p>
        <div className="mt-8">
          <LinkButton href="/shop">Shop Fragrances</LinkButton>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-5xl px-5 lg:px-8">
        <h1 className="mb-10 font-display text-3xl text-espresso">Your Cart</h1>

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId ?? "base"}`}
                className="flex gap-4 rounded-xl2 border border-espresso/10 bg-white/50 p-4"
              >
                <Link
                  href={`/product/${item.slug}`}
                  className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-brand-100"
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </Link>

                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        href={`/product/${item.slug}`}
                        className="font-display text-espresso"
                      >
                        {item.name}
                      </Link>
                      {item.size && (
                        <p className="text-xs text-rich/60">{item.size}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="text-rich/40 transition hover:text-red-600"
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center rounded-full border border-espresso/20">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.quantity - 1,
                            item.variantId
                          )
                        }
                        className="px-3 py-1 text-espresso"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.quantity + 1,
                            item.variantId
                          )
                        }
                        className="px-3 py-1 text-espresso"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-display text-espresso">
                      {formatNaira(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-xl2 border border-espresso/10 bg-white/60 p-6 shadow-premium-sm">
            <h2 className="font-display text-lg text-espresso">Order Summary</h2>
            <div className="mt-4 space-y-2 text-sm text-rich/80">
              <div className="flex justify-between">
                <span>Products Subtotal</span>
                <span>{formatNaira(subtotal)}</span>
              </div>
              <div className="flex justify-between text-rich/50">
                <span>Delivery Fee</span>
                <span>Calculated at checkout</span>
              </div>
            </div>
            <div className="mt-4 flex justify-between border-t border-espresso/10 pt-4 font-display text-espresso">
              <span>Total</span>
              <span>{formatNaira(subtotal)}</span>
            </div>

            <LinkButton href="/checkout" className="mt-6 w-full">
              Proceed to Checkout
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
