"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignVendorBatchLocation } from "@/lib/actions/batches";

interface VendorRow {
  userId: string;
  name: string;
  code: string;
  type: string | null;
  locationId: string | null;
}

export function VendorLocationsPanel({
  vendors,
  locations,
}: {
  vendors: VendorRow[];
  locations: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function change(userId: string, locationId: string) {
    setSavingId(userId);
    setError(null);
    const res = await assignVendorBatchLocation(userId, locationId || null);
    setSavingId(null);
    if (!res.success) setError(res.error ?? "Could not save.");
    else router.refresh();
  }

  return (
    <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-5">
      <h2 className="font-display text-lg text-espresso">Assign vendors to locations</h2>
      <p className="mt-1 text-sm text-rich/60">
        Pick the location each vendor serves (for example their campus). Customers ordering through that vendor&rsquo;s
        link can join batches for that location only, and the vendor can only open batches there. Vendors with no
        location have no batch delivery.
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {vendors.length === 0 ? (
        <p className="mt-3 text-sm text-rich/60">No active vendors yet.</p>
      ) : (
        <div className="mt-4 divide-y divide-espresso/5">
          {vendors.map((v) => (
            <div key={v.userId} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div>
                <p className="text-sm text-espresso">{v.name}</p>
                <p className="text-xs capitalize text-rich/50">
                  {v.code}
                  {v.type ? ` · ${v.type}` : ""}
                </p>
              </div>
              <select
                value={v.locationId ?? ""}
                disabled={savingId === v.userId}
                onChange={(e) => change(v.userId, e.target.value)}
                className="w-56 rounded-lg border border-espresso/15 px-3 py-1.5 text-sm"
              >
                <option value="">No location</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
