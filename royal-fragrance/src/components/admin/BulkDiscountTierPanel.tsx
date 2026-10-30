"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { applyDiscountTierToAllProducts, removeAllProductDiscounts } from "@/lib/actions/admin-products";

export function BulkDiscountTierPanel() {
  const router = useRouter();
  const [discountType, setDiscountType] = useState<"percentage" | "fixed_amount">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleApply() {
    if (!discountValue) return;
    if (
      !confirm(
        `Apply ${discountValue}${discountType === "percentage" ? "%" : " naira"} off to EVERY product? This can't be bulk-undone — you'd have to remove tiers product by product afterward.`
      )
    )
      return;

    setSaving(true);
    setError(null);
    setMessage(null);

    const result = await applyDiscountTierToAllProducts(discountType, Number(discountValue));

    setSaving(false);

    if (!result.success) {
      setError(result.error ?? "Could not apply the discount.");
      return;
    }

    setMessage(`Applied to ${result.count} product(s).`);
    setDiscountValue("");
    router.refresh();
  }

  const [offBusy, setOffBusy] = useState(false);
  const [alsoTiers, setAlsoTiers] = useState(false);
  const [offMessage, setOffMessage] = useState<string | null>(null);

  async function handleTurnOffAll() {
    if (
      !confirm(
        `Turn off the sale discount on EVERY product${alsoTiers ? " and remove all discount tiers" : ""}? Prices go back to normal across the shop.`
      )
    )
      return;
    setOffBusy(true);
    setOffMessage(null);
    const res = await removeAllProductDiscounts({ alsoTiers });
    setOffBusy(false);
    if (!res.success) {
      setOffMessage(res.error ?? "Could not turn off discounts.");
      return;
    }
    setOffMessage(
      `Turned off the discount on ${res.count} product(s)` +
        (alsoTiers ? ` and removed ${res.tiersRemoved ?? 0} discount tier(s).` : ".")
    );
    router.refresh();
  }

  return (
    <div className="mb-6 rounded-xl2 border border-espresso/10 bg-white/60 p-4 sm:p-5">
      <p className="mb-1 text-sm font-medium text-espresso">Bulk Discount Tier</p>
      <p className="mb-3 text-xs text-rich/50">
        Applies a promo-code-only discount tier to every product at once —
        useful when you meant to give all products a tier and only set it
        on some.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={discountType}
          onChange={(e) => setDiscountType(e.target.value as any)}
          className="rounded-lg border border-espresso/15 px-3 py-2 text-sm"
        >
          <option value="percentage">% off</option>
          <option value="fixed_amount">₦ off</option>
        </select>
        <input
          type="number"
          min={0}
          value={discountValue}
          onChange={(e) => setDiscountValue(e.target.value)}
          placeholder={discountType === "percentage" ? "15" : "2000"}
          className="rounded-lg border border-espresso/15 px-3 py-2 text-sm"
        />
        <button
          onClick={handleApply}
          disabled={saving || !discountValue}
          className="rounded-full bg-espresso px-4 py-2 text-sm text-cream hover:bg-rich disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "Applying…" : "Apply to All Products"}
        </button>
      </div>
      {message && <p className="mt-2 text-xs text-green-700">{message}</p>}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-4 border-t border-espresso/10 pt-4">
        <p className="mb-1 text-sm font-medium text-espresso">Turn off discounts</p>
        <p className="mb-3 text-xs text-rich/50">
          Removes the sale discount from every product at once. To turn it off for a single product, use
          &ldquo;Turn off&rdquo; under that product&rsquo;s price in the table below.
        </p>
        <label className="mb-3 flex items-center gap-2 text-xs text-rich/70">
          <input type="checkbox" checked={alsoTiers} onChange={(e) => setAlsoTiers(e.target.checked)} />
          Also remove all promo discount tiers
        </label>
        <button
          onClick={handleTurnOffAll}
          disabled={offBusy}
          className="rounded-full border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-40"
        >
          {offBusy ? "Turning off..." : "Turn Off Discount on All Products"}
        </button>
        {offMessage && <p className="mt-2 text-xs text-green-700">{offMessage}</p>}
      </div>
    </div>
  );
}
