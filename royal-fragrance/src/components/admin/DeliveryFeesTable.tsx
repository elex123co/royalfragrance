"use client";

import { useState } from "react";
import { updateDeliveryFee, toggleDeliveryZoneActive } from "@/lib/actions/admin-delivery";

interface Zone {
  id: string;
  name: string;
  state: string | null;
  fee: number;
  active: boolean;
}

export function DeliveryFeesTable({ zones }: { zones: Zone[] }) {
  const [rows, setRows] = useState(zones);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function handleFeeBlur(id: string, value: string) {
    const fee = Number(value);
    if (Number.isNaN(fee) || fee < 0) return;
    setSavingId(id);
    await updateDeliveryFee(id, fee);
    setSavingId(null);
  }

  async function handleToggleActive(id: string, active: boolean) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, active } : r)));
    await toggleDeliveryZoneActive(id, active);
  }

  return (
    <div className="overflow-x-auto rounded-xl2 border border-espresso/10 bg-white/60">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="border-b border-espresso/10 text-xs uppercase tracking-wide text-rich/50">
            <th className="px-4 py-3">State</th>
            <th className="px-4 py-3">Fee (₦)</th>
            <th className="px-4 py-3">Active</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((zone) => (
            <tr key={zone.id} className="border-b border-espresso/5 last:border-0">
              <td className="px-4 py-3 text-espresso">{zone.name}</td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  min={0}
                  defaultValue={zone.fee}
                  onBlur={(e) => handleFeeBlur(zone.id, e.target.value)}
                  disabled={savingId === zone.id}
                  className="w-28 rounded-lg border border-espresso/15 px-3 py-1.5 text-sm"
                />
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => handleToggleActive(zone.id, !zone.active)}
                  className={`relative h-6 w-11 rounded-full transition ${
                    zone.active ? "bg-espresso" : "bg-espresso/20"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-cream transition ${
                      zone.active ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
