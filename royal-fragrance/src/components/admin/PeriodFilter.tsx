"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { PERIOD_OPTIONS } from "@/lib/date-range";

export function PeriodFilter({
  period,
  from,
  to,
}: {
  period: string;
  from: string;
  to: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);

  function go(p: string, fromV?: string, toV?: string) {
    const q = new URLSearchParams({ period: p });
    if (p === "custom") {
      if (fromV) q.set("from", fromV);
      if (toV) q.set("to", toV);
    }
    router.push(`${pathname}?${q.toString()}#vendor-earnings`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="text-xs text-rich/60">
        Period
        <select
          value={period}
          onChange={(e) => {
            if (e.target.value === "custom") setF(from), setT(to);
            go(e.target.value, f, t);
          }}
          className="mt-1 block rounded-lg border border-espresso/20 bg-white px-3 py-2 text-sm text-espresso"
        >
          {PERIOD_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      {period === "custom" && (
        <>
          <label className="text-xs text-rich/60">
            From
            <input
              type="date"
              value={f}
              onChange={(e) => setF(e.target.value)}
              className="mt-1 block rounded-lg border border-espresso/20 bg-white px-3 py-2 text-sm text-espresso"
            />
          </label>
          <label className="text-xs text-rich/60">
            To
            <input
              type="date"
              value={t}
              onChange={(e) => setT(e.target.value)}
              className="mt-1 block rounded-lg border border-espresso/20 bg-white px-3 py-2 text-sm text-espresso"
            />
          </label>
          <button
            onClick={() => go("custom", f, t)}
            className="rounded-full bg-espresso px-4 py-2 text-sm text-cream"
          >
            Apply
          </button>
        </>
      )}
    </div>
  );
}
