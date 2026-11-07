"use client";

import Link from "next/link";
import { useCart, type CartItem } from "@/context/CartContext";
import { formatNaira } from "@/lib/utils/currency";
import { LinkButton } from "@/components/ui/Button";
import { BrandImage } from "@/components/ui/BrandImage";
import { Trash2 } from "lucide-react";
import { useT } from "@/lib/content/client";

export default function CartPage() { const _t = useT();
  const { items, removeItem, removeCombo, updateQuantity, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-32 text-center lg:px-8">
        <h1 className="font-display text-3xl text-espresso">{_t("cart.5f9938", "Your Cart is Empty")}</h1>
        <p className="mt-3 text-rich/70">{_t("cart.040bb8", "Discover a fragrance that feels like you.")}</p>
        <div className="mt-8">
          <LinkButton href="/shop">{_t("cart.1a0913", "Shop Fragrances")}</LinkButton>
        </div>
      </section>
    );
  }

  // Combo lines share a comboId and should render as one grouped card
  // rather than as separate items (one of which would confusingly show
  // ₦0) — everything else renders individually, unchanged.
  const individualItems = items.filter((i) => !i.comboId);
  const comboGroups = new Map<string, CartItem[]>();
  for (const item of items) {
    if (!item.comboId) continue;
    const existing = comboGroups.get(item.comboId) ?? [];
    comboGroups.set(item.comboId, [...existing, item]);
  }

  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-5xl px-5 lg:px-8">
        <h1 className="mb-10 font-display text-3xl text-espresso">{_t("cart.9bed3c", "Your Cart")}</h1>

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {[...comboGroups.entries()].map(([comboId, lines]) => {
              const comboTotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
              const quantity = lines[0]?.quantity ?? 1;
              return (
                <div
                  key={comboId}
                  className="rounded-xl2 border border-caramel/40 bg-caramel/5 p-4"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-caramel">{_t("cart.dcae58", "Combo")}</p>
                      <p className="font-display text-espresso">{lines[0]?.comboName}</p>
                    </div>
                    <button
                      onClick={() => removeCombo(comboId)}
                      className="text-rich/40 transition hover:text-red-600"
                      aria-label={_t("cart.b7567b", "Remove combo")}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <ul className="mb-3 space-y-1 text-sm text-rich/70">
                    {lines.map((l, i) => (
                      <li key={i}>{l.name}{l.size ? ` (${l.size})` : ""}</li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-rich/60">{_t("cart.f068d1", "Qty {quantity}", { quantity })}</span>
                    <span className="font-display text-espresso">{formatNaira(comboTotal)}</span>
                  </div>
                </div>
              );
            })}

            {individualItems.map((item) => (
              <div
                key={`${item.productId}-${item.variantId ?? "base"}`}
                className="flex gap-4 rounded-xl2 border border-espresso/10 bg-white/50 p-4"
              >
                <Link
                  href={`/product/${item.slug}`}
                  className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-brand-100"
                >
                  <BrandImage
                    src={item.image}
                    alt={item.name}
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
                      aria-label={_t("cart.76ecba", "Remove item")}
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
            <h2 className="font-display text-lg text-espresso">{_t("cart.c7df8a", "Order Summary")}</h2>
            <div className="mt-4 space-y-2 text-sm text-rich/80">
              <div className="flex justify-between">
                <span>{_t("cart.04d2de", "Products Subtotal")}</span>
                <span>{formatNaira(subtotal)}</span>
              </div>
              <div className="flex justify-between text-rich/50">
                <span>{_t("cart.9c12c6", "Delivery Fee")}</span>
                <span>{_t("cart.04397e", "Calculated at checkout")}</span>
              </div>
            </div>
            <div className="mt-4 flex justify-between border-t border-espresso/10 pt-4 font-display text-espresso">
              <span>{_t("cart.b25928", "Total")}</span>
              <span>{formatNaira(subtotal)}</span>
            </div>

            <LinkButton href="/checkout" className="mt-6 w-full">{_t("cart.d2f4d4", "Proceed to Checkout")}</LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
