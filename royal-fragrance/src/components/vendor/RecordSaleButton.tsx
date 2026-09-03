"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { recordVendorSale } from "@/lib/actions/vendor-sales";
import { formatNaira } from "@/lib/utils/currency";

interface InventoryLine {
  id: string;
  product_id: string;
  variant_id: string | null;
  available_quantity: number;
  products?: { name: string };
  product_variants?: { size: string } | null;
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
}: {
  transactionId: string;
  inventory: InventoryLine[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Record Sale
      </Button>
      {open && (
        <RecordSaleModal
          transactionId={transactionId}
          inventory={inventory}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function RecordSaleModal({
  transactionId,
  inventory,
  onClose,
}: {
  transactionId: string;
  inventory: InventoryLine[];
  onClose: () => void;
}) {
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
          price: 0,
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
      setError("Add at least one product.");
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
      setError(result.error ?? "Could not record sale");
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl2 bg-cream p-6">
        <h3 className="font-display text-lg text-espresso">Record Sale</h3>

        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-espresso">
            Select products from your inventory
          </p>
          <div className="flex flex-wrap gap-2">
            {inventory.length === 0 && (
              <p className="text-sm text-rich/50">
                No inventory assigned to you yet.
              </p>
            )}
            {inventory.map((inv) => (
              <button
                key={inv.id}
                type="button"
                onClick={() => addLine(inv)}
                disabled={inv.available_quantity <= 0}
                className="rounded-full border border-espresso/20 px-3 py-1.5 text-xs text-espresso disabled:opacity-30"
              >
                {inv.products?.name}
                {inv.product_variants?.size ? ` (${inv.product_variants.size})` : ""} —{" "}
                {inv.available_quantity} available
              </button>
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
                  placeholder="Price"
                  value={line.price}
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
            <p className="text-right text-sm font-medium text-espresso">
              Recorded total: {formatNaira(total)}
            </p>
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            placeholder="Customer name (optional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="rounded-lg border border-espresso/15 px-3 py-2 text-sm"
          />
          <input
            placeholder="Customer phone (optional)"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="rounded-lg border border-espresso/15 px-3 py-2 text-sm"
          />
        </div>
        <textarea
          placeholder="Notes (optional)"
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
          >
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving…" : "Save Sale Record"}
          </Button>
        </div>
      </div>
    </div>
  );
}
