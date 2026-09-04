"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { recordHandover } from "@/lib/actions/vendor-sales";

export function HandoverButton({ saleId }: { saleId: string }) {
  const [open, setOpen] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [method, setMethod] = useState<
    "personal_delivery" | "customer_pickup" | "courier_delivery" | "transfer_to_vendor" | "transfer_to_location"
  >("personal_delivery");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const result = await recordHandover({
      saleId,
      recipientName,
      recipientPhone,
      method,
      notes: notes || undefined,
    });

    setSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Could not record handover");
      return;
    }
    setOpen(false);
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Record Handover
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/60 p-4">
          <div className="w-full max-w-md rounded-xl2 bg-cream p-6">
            <h3 className="font-display text-lg text-espresso">
              Record Product Handover
            </h3>

            <div className="mt-4 space-y-3">
              <input
                placeholder="Recipient name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full rounded-lg border border-espresso/15 px-3 py-2 text-sm"
              />
              <input
                placeholder="Recipient phone"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="w-full rounded-lg border border-espresso/15 px-3 py-2 text-sm"
              />
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="w-full rounded-lg border border-espresso/15 px-3 py-2 text-sm"
              >
                <option value="personal_delivery">Personal Delivery</option>
                <option value="customer_pickup">Customer Pickup</option>
                <option value="courier_delivery">Courier Delivery</option>
                <option value="transfer_to_vendor">Transfer to Another Vendor</option>
                <option value="transfer_to_location">Transfer to Another Location</option>
              </select>
              <textarea
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-espresso/15 px-3 py-2 text-sm"
              />
            </div>

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-5 flex gap-3">
              <Button
                variant="outline"
                className="border-espresso/20 text-espresso"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={submitting || !recipientName || !recipientPhone}
              >
                {submitting ? "Saving…" : "Confirm Handover"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
