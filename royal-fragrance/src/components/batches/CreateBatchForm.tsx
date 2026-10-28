"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBatch } from "@/lib/actions/batches";
import { formatNaira } from "@/lib/utils/currency";
import type { BatchLocation } from "@/lib/data/batches";

export function CreateBatchForm({ locations }: { locations: BatchLocation[] }) {
  const router = useRouter();
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [cycle, setCycle] = useState<"weekly" | "monthly" | "custom">("weekly");
  const [customDate, setCustomDate] = useState("");
  const [maxMembers, setMaxMembers] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const loc = locations.find((l) => l.id === locationId);
  const n = Number(maxMembers);
  const share = loc && n >= 1 ? Math.ceil(loc.batch_fee / n) : null;

  if (locations.length === 0) {
    return <p className="text-sm text-rich/60">No batch locations yet. The admin adds locations and their fees first.</p>;
  }

  async function submit() {
    setBusy(true);
    setMsg(null);
    const res = await createBatch({ locationId, cycle, customDate, maxMembers: n, label });
    setBusy(false);
    if (!res.success) return setMsg({ ok: false, text: res.error ?? "Could not create batch." });
    setMsg({ ok: true, text: "Batch opened. Customers can now join it at checkout." });
    setMaxMembers("");
    setLabel("");
    router.refresh();
  }

  const input = "w-full rounded-lg border border-espresso/15 px-3 py-2 text-sm focus:border-caramel focus:outline-none";

  return (
    <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-5">
      <h2 className="font-display text-lg text-espresso">Open a new batch</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-espresso">
          Location
          <select className={input} value={locationId} onChange={(e) => setLocationId(e.target.value)}>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({formatNaira(l.batch_fee)} batch fee)
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-espresso">
          How many customers can join
          <input className={input} type="number" min={1} value={maxMembers} onChange={(e) => setMaxMembers(e.target.value)} placeholder="e.g. 10" />
        </label>
        <label className="text-sm text-espresso">
          Cycle
          <select className={input} value={cycle} onChange={(e) => setCycle(e.target.value as any)}>
            <option value="weekly">Weekly (closes in 7 days)</option>
            <option value="monthly">Monthly (closes in 1 month)</option>
            <option value="custom">Custom date</option>
          </select>
        </label>
        {cycle === "custom" ? (
          <label className="text-sm text-espresso">
            Closing date
            <input className={input} type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} />
          </label>
        ) : (
          <label className="text-sm text-espresso">
            Label (optional)
            <input className={input} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Hostel A weekly run" />
          </label>
        )}
      </div>
      {share !== null && (
        <p className="mt-3 text-sm text-rich/70">
          Each customer will pay <strong>{formatNaira(share)}</strong> delivery in this batch.
        </p>
      )}
      {msg && <p className={`mt-3 text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}
      <button
        onClick={submit}
        disabled={busy || !locationId || !(n >= 1)}
        className="mt-4 rounded-full bg-espresso px-5 py-2 text-sm text-cream hover:bg-rich disabled:opacity-40"
      >
        {busy ? "Opening…" : "Open Batch"}
      </button>
    </div>
  );
}
