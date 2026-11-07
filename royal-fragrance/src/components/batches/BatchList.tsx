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

function PromoteBatch({ batch, vendorCode }: { batch: BatchSummary; vendorCode: string }) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://royalfragrancegallery.com";
  const link = `${origin}/store/${encodeURIComponent(vendorCode)}/more`;
  const left = Math.max(0, b_max(batch) - batch.members);
  const message =
    `Batch delivery to ${batch.location.name} is open. ` +
    `Order your perfumes and share one delivery fee with other customers, about ${formatNaira(batch.share)} each. ` +
    `Delivery closes ${new Date(batch.closes_at).toLocaleDateString()}${left > 0 ? `, ${left} spot${left === 1 ? "" : "s"} left` : ""}. ` +
    `Order here and choose Batch delivery at checkout: ${link}`;

  function copy(text: string) {
    try {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-caramel/30 bg-caramel/5 p-3">
      <p className="text-xs font-medium text-espresso">Promote this batch</p>
      <p className="mt-1 break-all text-xs text-rich/60">{link}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <button onClick={() => copy(link)} className="rounded-full border border-espresso/20 px-3 py-1 hover:bg-espresso/5">
          {copied ? "Copied" : "Copy link"}
        </button>
        <button onClick={() => copy(message)} className="rounded-full border border-espresso/20 px-3 py-1 hover:bg-espresso/5">
          Copy message
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-green-600 px-3 py-1 text-white hover:bg-green-700"
        >
          Share on WhatsApp
        </a>
      </div>
    </div>
  );
}

function b_max(b: BatchSummary) {
  return b.max_members;
}

export function BatchList({
  batches,
  members,
  showCreator = false,
  vendorCode,
}: {
  batches: BatchSummary[];
  members: Member[];
  showCreator?: boolean;
  vendorCode?: string;
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
                  {b.cycle} · {new Date(b.starts_at).toLocaleDateString()} to {new Date(b.closes_at).toLocaleDateString()} · {formatNaira(b.share)} per customer
                  {showCreator ? ` · opened by ${b.created_by_role}` : ""}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs capitalize ${STATUS_STYLE[b.status]}`}>{b.status}</span>
            </div>
            <p className="mt-2 text-sm text-rich/80">
              {b.members} joined · needs {b.min_members}{b.max_members !== b.min_members ? ` to ${b.max_members}` : ""}{b.members >= b.min_members ? " · ready to deliver" : ` · ${b.min_members - b.members} more needed`}
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
            {vendorCode && b.status === "open" && <PromoteBatch batch={b} vendorCode={vendorCode} />}
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
