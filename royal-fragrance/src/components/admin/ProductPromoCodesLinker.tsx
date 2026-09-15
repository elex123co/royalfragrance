"use client";

import { useState } from "react";
import { setProductPromoCodes } from "@/lib/actions/admin-products";

interface PromoCode {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
}

export function ProductPromoCodesLinker({
  productId,
  allCodes,
  initiallyLinkedIds,
}: {
  productId: string;
  allCodes: PromoCode[];
  initiallyLinkedIds: string[];
}) {
  const [selected, setSelected] = useState<string[]>(initiallyLinkedIds);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(id: string) {
    setSaved(false);
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function handleSave() {
    setSaving(true);
    await setProductPromoCodes(productId, selected);
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="mt-6 rounded-xl2 border border-espresso/10 bg-white/60 p-6">
      <h2 className="mb-1 font-display text-lg text-espresso">Promo Codes</h2>
      <p className="mb-4 text-sm text-rich/60">
        Choose which codes can discount this specific product. A code
        created without any products checked here applies storewide instead.
      </p>

      {allCodes.length === 0 ? (
        <p className="text-sm text-rich/50">
          No promo codes exist yet —{" "}
          <a href="/admin/promo-codes" className="text-caramel underline">
            create one first
          </a>
          .
        </p>
      ) : (
        <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-espresso/10 p-2">
          {allCodes.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm text-rich/80">
              <input
                type="checkbox"
                checked={selected.includes(c.id)}
                onChange={() => toggle(c.id)}
              />
              <span className="font-mono">{c.code}</span>
              <span className="text-xs text-rich/50">
                (
                {c.discount_type === "percentage"
                  ? `${c.discount_value}% off`
                  : `₦${c.discount_value.toLocaleString()} off`}
                )
              </span>
            </label>
          ))}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || allCodes.length === 0}
        className="mt-4 rounded-full bg-espresso px-4 py-2 text-sm text-cream hover:bg-rich disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save Promo Codes"}
      </button>
    </div>
  );
}
