"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveBatchLocation, deleteBatchLocation } from "@/lib/actions/batches";
import type { BatchLocation } from "@/lib/data/batches";

export function BatchLocationsPanel({ locations }: { locations: BatchLocation[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({ name: "", state: "Lagos", batchFee: "", individualFee: "" });

  async function save(l: Partial<BatchLocation> & { name: string; batch_fee: number; individual_fee: number; active: boolean; state: string }) {
    setBusy(true);
    setError(null);
    const res = await saveBatchLocation({
      id: l.id,
      name: l.name,
      state: l.state,
      batchFee: l.batch_fee,
      individualFee: l.individual_fee,
      active: l.active,
    });
    setBusy(false);
    if (!res.success) setError(res.error ?? "Could not save.");
    else router.refresh();
    return res.success;
  }

  async function remove(id: string) {
    if (!confirm("Delete this location?")) return;
    const res = await deleteBatchLocation(id);
    if (!res.success) setError(res.error ?? "Could not delete.");
    else router.refresh();
  }

  const cell = "w-28 rounded-lg border border-espresso/15 px-3 py-1.5 text-sm";

  return (
    <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-5">
      <h2 className="font-display text-lg text-espresso">Batch locations and fees</h2>
      <p className="mt-1 text-sm text-rich/60">
        Batch fee is the full amount for one batch trip; customers split it. Individual fee is the normal fee a
        customer pays if they leave the batch and ship alone.
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-rich/50">
              <th className="py-2 pr-3">Location</th>
              <th className="py-2 pr-3">Batch fee</th>
              <th className="py-2 pr-3">Individual fee</th>
              <th className="py-2 pr-3">Active</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {locations.map((l) => (
              <tr key={l.id} className="border-t border-espresso/5">
                <td className="py-2 pr-3 text-espresso">
                  {l.name} <span className="text-xs text-rich/50">{l.state}</span>
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="number"
                    min={0}
                    defaultValue={l.batch_fee}
                    className={cell}
                    onBlur={(e) => Number(e.target.value) !== l.batch_fee && save({ ...l, batch_fee: Number(e.target.value) })}
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="number"
                    min={0}
                    defaultValue={l.individual_fee}
                    className={cell}
                    onBlur={(e) => Number(e.target.value) !== l.individual_fee && save({ ...l, individual_fee: Number(e.target.value) })}
                  />
                </td>
                <td className="py-2 pr-3">
                  <input type="checkbox" checked={l.active} onChange={(e) => save({ ...l, active: e.target.checked })} />
                </td>
                <td className="py-2 text-right">
                  <button onClick={() => remove(l.id)} className="text-xs text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-espresso/10 pt-4">
        <input className="w-44 rounded-lg border border-espresso/15 px-3 py-1.5 text-sm" placeholder="Location name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <input className={cell} type="number" min={0} placeholder="Batch fee" value={draft.batchFee} onChange={(e) => setDraft({ ...draft, batchFee: e.target.value })} />
        <input className={cell} type="number" min={0} placeholder="Individual fee" value={draft.individualFee} onChange={(e) => setDraft({ ...draft, individualFee: e.target.value })} />
        <button
          disabled={busy || !draft.name.trim()}
          onClick={async () => {
            const ok = await save({ name: draft.name, state: draft.state, batch_fee: Number(draft.batchFee) || 0, individual_fee: Number(draft.individualFee) || 0, active: true });
            if (ok) setDraft({ name: "", state: "Lagos", batchFee: "", individualFee: "" });
          }}
          className="rounded-full bg-espresso px-4 py-1.5 text-sm text-cream hover:bg-rich disabled:opacity-40"
        >
          Add location
        </button>
      </div>
    </div>
  );
}
