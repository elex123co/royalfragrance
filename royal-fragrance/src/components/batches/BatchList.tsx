"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setBatchStatus } from "@/lib/actions/batches";
import { formatNaira } from "@/lib/utils/currency";
import type { BatchSummary } from "@/lib/data/batches";

interface Member {
  id: string;
  order_number: string;
  batch_id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  batch_switched_at: string | null;
}

const STATUS_STYLE: Record<string, string> = {
  open: "bg-green-100 text-green-800",
  closed: "bg-amber-100 text-amber-800",
  delivered: "bg-espresso/10 text-espresso",
  cancelled: "bg-red-100 text-red-700",
};

export function BatchList({
  batches,
  members,
  showCreator = false,
}: {
  batches: BatchSummary[];
  members: Member[];
  showCreator?: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function change(id: string, status: "open" | "closed" | "delivered" | "cancelled") {
    setBusyId(id);
    setError(null);
    const res = await setBatchStatus(id, status);
    setBusyId(null);
    if (!res.success) return setError(res.error ?? "Could not update batch.");
    router.refresh();
  }

  if (batches.length === 0) return <p className="text-sm text-rich/60">No batches yet.</p>;

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {batches.map((b) => {
        const list = members.filter((m) => m.batch_id === b.id);
        const active = list.filter((m) => !m.batch_switched_at);
        return (
          <div key={b.id} className="rounded-xl2 border border-espresso/10 bg-white/60 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-espresso">
                  {b.location.name}
                  {b.label ? ` — ${b.label}` : ""}
                </p>
                <p className="text-xs text-rich/60">
                  {b.cycle} · closes {new Date(b.closes_at).toLocaleDateString()} · {formatNaira(b.share)} per customer
                  {showCreator ? ` · opened by ${b.created_by_role}` : ""}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs capitalize ${STATUS_STYLE[b.status]}`}>{b.status}</span>
            </div>
            <p className="mt-2 text-sm text-rich/80">
              {b.members} of {b.max_members} customers joined
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {b.status === "open" && (
                <button disabled={busyId === b.id} onClick={() => change(b.id, "closed")} className="rounded-full border border-espresso/20 px-3 py-1 hover:bg-espresso/5">
                  Close to new customers
                </button>
              )}
              {b.status === "closed" && (
                <button disabled={busyId === b.id} onClick={() => change(b.id, "open")} className="rounded-full border border-espresso/20 px-3 py-1 hover:bg-espresso/5">
                  Reopen
                </button>
              )}
              {(b.status === "open" || b.status === "closed") && (
                <>
                  <button disabled={busyId === b.id} onClick={() => change(b.id, "delivered")} className="rounded-full bg-espresso px-3 py-1 text-cream hover:bg-rich">
                    Mark delivered
                  </button>
                  <button disabled={busyId === b.id} onClick={() => change(b.id, "cancelled")} className="rounded-full border border-red-300 px-3 py-1 text-red-700 hover:bg-red-50">
                    Cancel
                  </button>
                </>
              )}
              <button onClick={() => setOpenId(openId === b.id ? null : b.id)} className="rounded-full border border-espresso/20 px-3 py-1 hover:bg-espresso/5">
                {openId === b.id ? "Hide customers" : `View customers (${active.length})`}
              </button>
            </div>
            {openId === b.id && (
              <div className="mt-3 divide-y divide-espresso/5 rounded-lg border border-espresso/10 bg-cream/50 text-sm">
                {list.length === 0 && <p className="p-3 text-rich/60">No paid customers yet.</p>}
                {list.map((m) => (
                  <div key={m.id} className="p-3">
                    <p className="text-espresso">
                      {m.customer_name} · {m.customer_phone}
                      {m.batch_switched_at && <span className="ml-2 text-xs text-amber-700">switched to individual delivery</span>}
                    </p>
                    <p className="text-xs text-rich/60">
                      {m.order_number} · {m.delivery_address}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
