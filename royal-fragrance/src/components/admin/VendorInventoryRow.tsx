"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  setVendorInventoryQuantity,
  deleteVendorInventoryLine,
} from "@/lib/actions/admin-inventory";

export function VendorInventoryRow({
  inventoryId,
  name,
  size,
  imageUrl,
  assigned,
  sold,
  left,
}: {
  inventoryId: string;
  name: string;
  size: string | null;
  imageUrl: string | null;
  assigned: number;
  sold: number;
  left: number;
}) {
  const router = useRouter();
  const [qty, setQty] = useState(String(left));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const changed = qty !== String(left);

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await setVendorInventoryQuantity({
        inventoryId,
        quantity: Number(qty),
      });
      if (!res.success) return setError(res.error ?? "Could not save");
      router.refresh();
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const res = await deleteVendorInventoryLine(inventoryId);
      if (!res.success) return setError(res.error ?? "Could not delete");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-espresso/10 bg-white/70 p-3">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-espresso/5">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        ) : null}
      </div>

      <div className="min-w-[8rem] flex-1">
        <p className="text-sm font-medium text-espresso">
          {name}
          {size ? ` (${size})` : ""}
        </p>
        <p className="text-xs text-rich/60">
          Assigned {assigned} · Sold {sold} · Left {left}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          aria-label={`Quantity of ${name}`}
          className="w-20 rounded-lg border border-espresso/20 px-2 py-1.5 text-sm"
        />
        <button
          onClick={save}
          disabled={!changed || pending}
          className="rounded-full bg-espresso px-3 py-1.5 text-xs text-cream disabled:opacity-40"
        >
          {pending && changed ? "Saving..." : "Save"}
        </button>

        {confirmDelete ? (
          <span className="flex items-center gap-2 rounded-full bg-red-50 px-2 py-1">
            <span className="text-xs text-red-700">Delete this product?</span>
            <button
              onClick={remove}
              disabled={pending}
              className="rounded-full bg-red-600 px-3 py-1 text-xs text-white disabled:opacity-50"
            >
              Yes, delete
            </button>
            <button onClick={() => setConfirmDelete(false)} className="text-xs text-rich/60">
              No
            </button>
          </span>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            <Trash2 size={13} /> Delete
          </button>
        )}
      </div>
      {error && <p className="w-full text-xs text-red-700">{error}</p>}
    </div>
  );
}
