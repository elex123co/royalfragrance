"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  createPromoCode,
  togglePromoCodeActive,
  deletePromoCode,
} from "@/lib/actions/admin-promo-codes";

interface PromoCode {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  active: boolean;
  expires_at: string | null;
  usage_limit: number | null;
  times_used: number;
  created_at: string;
}

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "ROYAL-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function PromoCodesPanel({ codes }: { codes: PromoCode[] }) {
  const router = useRouter();
  const [code, setCode] = useState(randomCode());
  const [discountType, setDiscountType] = useState<"percentage" | "fixed_amount">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const result = await createPromoCode({
      code,
      discountType,
      discountValue: Number(discountValue),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
    });

    setSaving(false);

    if (!result.success) {
      setError(result.error ?? "Could not create code.");
      return;
    }

    setCode(randomCode());
    setDiscountValue("");
    setExpiresAt("");
    setUsageLimit("");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleCreate}
        className="rounded-xl2 border border-espresso/10 bg-white/60 p-6"
      >
        <h2 className="mb-4 font-display text-lg text-espresso">Create a Code</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-espresso">Code</label>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="flex-1 rounded-lg border border-espresso/15 px-4 py-2.5 text-sm uppercase focus:border-caramel focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setCode(randomCode())}
                className="rounded-lg border border-espresso/20 px-3 text-xs text-espresso hover:bg-espresso/5"
              >
                Randomize
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-espresso">Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full rounded-lg border border-espresso/15 px-3 py-2.5 text-sm focus:border-caramel focus:outline-none"
              >
                <option value="percentage">% off</option>
                <option value="fixed_amount">₦ off</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-espresso">Value</label>
              <input
                type="number"
                min={0}
                required
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "percentage" ? "15" : "2000"}
                className="w-full rounded-lg border border-espresso/15 px-3 py-2.5 text-sm focus:border-caramel focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-espresso">
              Expires (optional)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-espresso">
              Usage limit (optional)
            </label>
            <input
              type="number"
              min={1}
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              placeholder="Unlimited"
              className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
        )}

        <Button type="submit" className="mt-4" disabled={saving}>
          {saving ? "Creating…" : "Create Code"}
        </Button>
      </form>

      <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-6">
        <h2 className="mb-4 font-display text-lg text-espresso">All Codes</h2>
        <div className="space-y-2">
          {codes.length === 0 && <p className="text-sm text-rich/50">No codes yet.</p>}
          {codes.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-espresso/10 bg-cream/60 px-4 py-3 text-sm"
            >
              <div>
                <p className="font-mono font-medium text-espresso">{c.code}</p>
                <p className="text-xs text-rich/50">
                  {c.discount_type === "percentage" ? `${c.discount_value}% off` : `₦${c.discount_value.toLocaleString()} off`}
                  {" · "}
                  Used {c.times_used}
                  {c.usage_limit ? `/${c.usage_limit}` : ""}
                  {c.expires_at ? ` · Expires ${new Date(c.expires_at).toLocaleDateString()}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    await togglePromoCodeActive(c.id, !c.active);
                    router.refresh();
                  }}
                  className={`rounded-full px-2.5 py-1 text-xs ${
                    c.active ? "bg-green-100 text-green-700" : "bg-espresso/10 text-rich/50"
                  }`}
                >
                  {c.active ? "Active" : "Disabled"}
                </button>
                <button
                  onClick={async () => {
                    await deletePromoCode(c.id);
                    router.refresh();
                  }}
                  className="text-xs text-red-500 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
