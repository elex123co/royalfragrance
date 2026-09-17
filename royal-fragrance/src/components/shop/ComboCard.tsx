"use client";

import { useCart } from "@/context/CartContext";
import { formatNaira } from "@/lib/utils/currency";
import { BrandImage } from "@/components/ui/BrandImage";
import type { Combo } from "@/lib/data/combos";

export function ComboCard({ combo }: { combo: Combo }) {
  const { addCombo } = useCart();

  const individualTotal = combo.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const savings = individualTotal - combo.comboPrice;

  function handleAdd() {
    addCombo({
      id: combo.id,
      name: combo.name,
      comboPrice: combo.comboPrice,
      items: combo.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId ?? undefined,
        productName: item.productName,
        productSlug: item.productSlug,
        productImage: item.productImage,
        quantity: item.quantity,
      })),
    });
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-espresso/10 bg-white shadow-premium-sm">
      <div className="relative aspect-[4/3] bg-brand-100">
        {combo.image ? (
          <BrandImage src={combo.image} alt={combo.name} sizes="(max-width: 768px) 100vw, 33vw" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">🎁</div>
        )}
        {savings > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white shadow-sm">
            Save {formatNaira(savings)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-lg text-espresso">{combo.name}</h3>
        {combo.description && <p className="text-sm text-rich/70">{combo.description}</p>}
        <p className="text-xs uppercase tracking-widest text-caramel">Includes</p>
        <ul className="text-sm text-rich/70">
          {combo.items.map((item, i) => (
            <li key={i}>
              {item.productName} × {item.quantity}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="font-display text-xl text-espresso">
            {formatNaira(combo.comboPrice)}
          </span>
          {savings > 0 && (
            <span className="text-sm text-rich/40 line-through">
              {formatNaira(individualTotal)}
            </span>
          )}
        </div>
        <button
          onClick={handleAdd}
          className="mt-2 rounded-full bg-espresso px-4 py-2.5 text-sm text-cream hover:bg-rich"
        >
          Add Combo to Cart
        </button>
      </div>
    </div>
  );
}
