"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { removeVendorInventory } from "@/lib/actions/admin-inventory";

export function RemoveInventoryButton({
  inventoryId,
  available,
  label,
}: {
  inventoryId: string;
  available: number;
  label: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(String(Math.max(available, 1)));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmRemove() {
    setError(null);
    startTransition(async () => {
      const result = await removeVendorInventory({
        inventoryId,
        quantity: available > 0 ? Number(qty) : undefined,
      });
      if (!result.success) {
        setError(result.error ?? "Could not remove");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label={`Remove ${label}`}
        className="inline-flex items-center gap-1 rounded-full border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
      >
        <Trash2 size={12} /> {available > 0 ? "Remove" : "Delete"}
      </button>
    );
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2 rounded-lg bg-red-50 p-2">
      {available > 0 ? (
        <>
          <span className="text-xs text-red-700">Remove how many?</span>
          <input
            type="number"
            min={1}
            max={available}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-20 rounded border border-red-200 px-2 py-1 text-xs"
          />
        </>
      ) : (
        <span className="text-xs text-red-700">Delete this empty line?</span>
      )}
      <button
        onClick={confirmRemove}
        disabled={pending}
        className="rounded-full bg-red-600 px-3 py-1 text-xs text-white disabled:opacity-50"
      >
        {pending ? "Removing…" : "Confirm"}
      </button>
      <button onClick={() => setOpen(false)} className="text-xs text-rich/60">
        Cancel
      </button>
      {error && <p className="w-full text-xs text-red-700">{error}</p>}
    </div>
  );
}
