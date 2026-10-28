"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignVendorBatchLocation } from "@/lib/actions/batches";

export function VendorBatchLocationForm({
  vendorUserId,
  current,
  locations,
}: {
  vendorUserId: string;
  current: string | null;
  locations: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [value, setValue] = useState(current ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    const res = await assignVendorBatchLocation(vendorUserId, value || null);
    setBusy(false);
    setMsg(res.success ? { ok: true, text: "Saved." } : { ok: false, text: res.error ?? "Could not save." });
    if (res.success) router.refresh();
  }

  return (
    <div className="mb-6 rounded-xl2 border border-espresso/10 bg-white/60 p-6">
      <h2 className="mb-1 font-display text-lg text-espresso">Batch delivery location</h2>
      <p className="mb-3 text-sm text-rich/60">
        The location this vendor serves, such as their campus. Customers ordering through this vendor&rsquo;s link
        can join batches for this location only, and the vendor can only open batches there.
      </p>
      <div className="flex flex-wrap gap-2">
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="rounded-lg border border-espresso/15 px-3 py-2 text-sm"
        >
          <option value="">No location (no batch delivery)</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <button
          onClick={save}
          disabled={busy}
          className="rounded-full bg-espresso px-5 py-2 text-sm text-cream hover:bg-rich disabled:opacity-40"
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
      {msg && <p className={`mt-2 text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}
    </div>
  );
}
