"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { recordVendorSale } from "@/lib/actions/vendor-sales";
import { formatNaira } from "@/lib/utils/currency";
import { useT } from "@/lib/content/client";

interface InventoryLine {
  id: string;
  product_id: string;
  variant_id: string | null;
  available_quantity: number;
  products?: { name: string; base_price?: number | string | null };
  product_variants?: { size: string; price?: number | string | null } | null;
}

interface SaleLine {
  productId: string;
  variantId?: string;
  name: string;
  quantity: number;
  price: number;
}

export function RecordSaleButton({
  transactionId,
  inventory,
  paymentAmount,
  remaining,
}: {
  transactionId: string;
  inventory: InventoryLine[];
  paymentAmount?: number;
  remaining?: number;
}) { const _t = useT();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        {remaining !== undefined && paymentAmount !== undefined && remaining < paymentAmount
          ? _t("vendor.recordsalebutton.121299", "Add more products")
          : _t("vendor.recordsalebutton.73380f", "Record Sale")}
      </Button>
      {open && (
        <RecordSaleModal
          transactionId={transactionId}
          inventory={inventory}
          remaining={remaining}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function RecordSaleModal({
  transactionId,
  inventory,
  remaining,
  onClose,
}: {
  transactionId: string;
  inventory: InventoryLine[];
  remaining?: number;
  onClose: () => void;
}) { const _t = useT();
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addLine(inv: InventoryLine) {
    setLines((prev) => {
      const existing = prev.find(
        (l) => l.productId === inv.product_id && l.variantId === (inv.variant_id ?? undefined)
      );
      if (existing) {
        return prev.map((l) =>
          l === existing ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...prev,
        {
          productId: inv.product_id,
          variantId: inv.variant_id ?? undefined,
          name: `${inv.products?.name ?? "Product"}${inv.product_variants?.size ? ` (${inv.product_variants.size})` : ""}`,
          quantity: 1,
          // Start from the shop price of this size; the vendor can still change it.
          price: Number(inv.product_variants?.price ?? inv.products?.base_price ?? 0),
        },
      ];
    });
  }

  function updateLine(index: number, patch: Partial<SaleLine>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  async function handleSubmit() {
    if (lines.length === 0) {
      setError(_t("vendor.recordsalebutton.e2ed1f", "Add at least one product."));
      return;
    }
    const unpriced = lines.find((l) => !(l.price > 0));
    if (unpriced) {
      setError(`Enter the selling price for ${unpriced.name}.`);
      return;
    }
    if (remaining !== undefined && total > remaining) {
      setError(
        `These products come to ${formatNaira(total)}, which is more than the ${formatNaira(remaining)} of this payment still to be matched.`
      );
      return;
    }
    setSubmitting(true);
    setError(null);

    const result = await recordVendorSale({
      transactionId,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      notes: notes || undefined,
      items: lines.map((l) => ({
        productId: l.productId,
        variantId: l.variantId,
        quantity: l.quantity,
        price: l.price,
      })),
    });

    setSubmitting(false);

    if (!result.success) {
      setError(result.error ?? _t("vendor.recordsalebutton.174b21", "Could not record sale"));
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl2 bg-cream p-6">
        <h3 className="font-display text-lg text-espresso">{_t("vendor.recordsalebutton.73380f", "Record Sale")}</h3>
        {remaining !== undefined && (
          <p className="mt-1 text-xs text-rich/60">{_t("vendor.recordsalebutton.816c03", "You can add more than one product to this payment. Their prices must add up to {v} or less. If it is less, the rest stays open so you can add the other products later.", { v: formatNaira(remaining) })}</p>
        )}

        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-espresso">{_t("vendor.recordsalebutton.cf9e8d", "Select products from your inventory")}</p>
          <div className="flex flex-wrap gap-2">
            {inventory.length === 0 && (
              <p className="text-sm text-rich/50">{_t("vendor.recordsalebutton.609ea4", "No inventory assigned to you yet.")}</p>
            )}
            {inventory.map((inv) => (
              <button
                key={inv.id}
                type="button"
                onClick={() => addLine(inv)}
                disabled={inv.available_quantity <= 0}
                className="rounded-full border border-espresso/20 px-3 py-1.5 text-xs text-espresso disabled:opacity-30"
              >
                {_t("vendor.recordsalebutton.9c10d8", "{name}{v} — {available_quantity} available", { name: inv.products?.name, v: inv.product_variants?.size ? ` (${inv.product_variants.size})` : "", available_quantity: inv.available_quantity })}</button>
            ))}
          </div>
        </div>

        {lines.length > 0 && (
          <div className="mt-4 space-y-2">
            {lines.map((line, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex-1 text-sm text-espresso">{line.name}</span>
                <input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })}
                  className="w-16 rounded-lg border border-espresso/15 px-2 py-1 text-sm"
                />
                <input
                  type="number"
                  placeholder={_t("vendor.recordsalebutton.ed163a", "Price each")}
                  min={0}
                  value={line.price === 0 ? "" : line.price}
                  onChange={(e) => updateLine(i, { price: Number(e.target.value) })}
                  className="w-24 rounded-lg border border-espresso/15 px-2 py-1 text-sm"
                />
                <button
                  onClick={() => removeLine(i)}
                  className="text-rich/40 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            ))}
            <p className="text-right text-sm font-medium text-espresso">{_t("vendor.recordsalebutton.df5e39", "Recorded total: {v}", { v: formatNaira(total) })}
              {remaining !== undefined && (
                <span
                  className={`block text-xs font-normal ${
                    total > remaining ? "text-red-600" : "text-rich/60"
                  }`}
                >
                  {total > remaining
                    ? `${formatNaira(total - remaining)} over the payment`
                    : total === remaining
                      ? _t("vendor.recordsalebutton.207a09", "Matches the payment")
                      : `${formatNaira(remaining - total)} of the payment still unmatched`}
                </span>
              )}
            </p>
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            placeholder={_t("vendor.recordsalebutton.75d34d", "Customer name (optional)")}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="rounded-lg border border-espresso/15 px-3 py-2 text-sm"
          />
          <input
            placeholder={_t("vendor.recordsalebutton.60d44f", "Customer phone (optional)")}
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="rounded-lg border border-espresso/15 px-3 py-2 text-sm"
          />
        </div>
        <textarea
          placeholder={_t("vendor.recordsalebutton.4d56ca", "Notes (optional)")}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-3 w-full rounded-lg border border-espresso/15 px-3 py-2 text-sm"
          rows={2}
        />

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <Button
            variant="outline"
            className="border-espresso/20 text-espresso"
            onClick={onClose}
          >{_t("vendor.recordsalebutton.77dfd2", "Cancel")}</Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
            {submitting ? _t("vendor.recordsalebutton.56a228", "Saving…") : _t("vendor.recordsalebutton.21c047", "Save Sale Record")}
          </Button>
        </div>
      </div>
    </div>
  );
}
