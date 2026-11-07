"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBatch } from "@/lib/actions/batches";
import { formatNaira } from "@/lib/utils/currency";
import type { BatchLocation } from "@/lib/data/batches";
import { useT } from "@/lib/content/client";

export function CreateBatchForm({
  locations,
  showFees = false,
}: {
  locations: BatchLocation[];
  showFees?: boolean;
}) { const _t = useT();
  const router = useRouter();
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [cycle, setCycle] = useState<"weekly" | "monthly" | "custom">("weekly");
  const [startDate, setStartDate] = useState("");
  const [customDate, setCustomDate] = useState("");
  const [minMembers, setMinMembers] = useState("");
  const [maxMembers, setMaxMembers] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const loc = locations.find((l) => l.id === locationId);
  const n = Number(minMembers);
  const share = loc && n >= 1 ? Math.ceil(loc.batch_fee / n) : null;

  if (locations.length === 0) {
    return <p className="text-sm text-rich/60">{_t("batches.createbatchform.2d23f9", "No batch locations yet. The admin adds locations and their fees first.")}</p>;
  }

  async function submit() {
    setBusy(true);
    setMsg(null);
    const res = await createBatch({ locationId, cycle, startDate, customDate, minMembers: n, maxMembers: Number(maxMembers) || n, label });
    setBusy(false);
    if (!res.success) return setMsg({ ok: false, text: res.error ?? _t("batches.createbatchform.5c4715", "Could not create batch.") });
    setMsg({ ok: true, text: _t("batches.createbatchform.c7b13f", "Batch opened. Customers can now join it at checkout.") });
    setMinMembers("");
    setMaxMembers("");
    setLabel("");
    router.refresh();
  }

  const input = "w-full rounded-lg border border-espresso/15 px-3 py-2 text-sm focus:border-caramel focus:outline-none";

  return (
    <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-5">
      <h2 className="font-display text-lg text-espresso">{_t("batches.createbatchform.5d532e", "Open a new batch")}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-espresso">{_t("batches.createbatchform.d219c6", "Location")}<select className={input} value={locationId} onChange={(e) => setLocationId(e.target.value)}>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
                {showFees ? ` (${formatNaira(l.batch_fee)} batch fee)` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-espresso">{_t("batches.createbatchform.34163e", "Minimum customers to go out")}<input className={input} type="number" min={1} value={minMembers} onChange={(e) => setMinMembers(e.target.value)} placeholder={_t("batches.createbatchform.4442f0", "e.g. 8")} />
        </label>
        <label className="text-sm text-espresso">{_t("batches.createbatchform.ee0c47", "Maximum customers allowed")}<input className={input} type="number" min={1} value={maxMembers} onChange={(e) => setMaxMembers(e.target.value)} placeholder={_t("batches.createbatchform.9bee06", "e.g. 12 (leave blank for same as minimum)")} />
        </label>
        <label className="text-sm text-espresso">{_t("batches.createbatchform.f5eda1", "Cycle")}<select className={input} value={cycle} onChange={(e) => setCycle(e.target.value as any)}>
            <option value="weekly">{_t("batches.createbatchform.88d43b", "Weekly (closes in 7 days)")}</option>
            <option value="monthly">{_t("batches.createbatchform.867435", "Monthly (closes in 1 month)")}</option>
            <option value="custom">{_t("batches.createbatchform.a39a91", "Custom date")}</option>
          </select>
        </label>
        {cycle === "custom" ? (
          <>
            <label className="text-sm text-espresso">{_t("batches.createbatchform.4969bb", "Starting date")}<input className={input} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            <label className="text-sm text-espresso">{_t("batches.createbatchform.a47e9f", "Closing date")}<input className={input} type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} />
            </label>
          </>
        ) : (
          <label className="text-sm text-espresso">{_t("batches.createbatchform.849686", "Label (optional)")}<input className={input} value={label} onChange={(e) => setLabel(e.target.value)} placeholder={_t("batches.createbatchform.47807f", "e.g. Hostel A weekly run")} />
          </label>
        )}
      </div>
      {share !== null && (
        <p className="mt-3 text-sm text-rich/70">{_t("batches.createbatchform.aee355", "Each customer will pay")}{" "}<strong>{formatNaira(share)}</strong>{" "}{_t("batches.createbatchform.f7a57d", "delivery in this batch, based on the minimum of {n} customers.", { n })}</p>
      )}
      {msg && <p className={`mt-3 text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}
      <button
        onClick={submit}
        disabled={busy || !locationId || !(n >= 1)}
        className="mt-4 rounded-full bg-espresso px-5 py-2 text-sm text-cream hover:bg-rich disabled:opacity-40"
      >
        {busy ? _t("batches.createbatchform.b1b853", "Opening…") : _t("batches.createbatchform.8a8b42", "Open Batch")}
      </button>
    </div>
  );
}
