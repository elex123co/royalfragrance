"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  createPromoCode,
  createPromoCodesBulk,
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
  const [mode, setMode] = useState<"single" | "bulk">("single");

  // Single-code form state
  const [code, setCode] = useState(randomCode());
  const [discountType, setDiscountType] = useState<"percentage" | "fixed_amount">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [usageLimit, setUsageLimit] = useState("");

  // Bulk-generation form state
  const [bulkDiscountType, setBulkDiscountType] = useState<"percentage" | "fixed_amount">("percentage");
  const [bulkDiscountValue, setBulkDiscountValue] = useState("");
  const [bulkQuantity, setBulkQuantity] = useState("20");
  const [bulkPrefix, setBulkPrefix] = useState("ROYAL");
  const [bulkExpiresAt, setBulkExpiresAt] = useState("");
  const [bulkUsageLimit, setBulkUsageLimit] = useState("1");
  const [generatedCodes, setGeneratedCodes] = useState<string[] | null>(null);

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

  async function handleBulkGenerate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setGeneratedCodes(null);

    const result = await createPromoCodesBulk({
      discountType: bulkDiscountType,
      discountValue: Number(bulkDiscountValue),
      quantity: Number(bulkQuantity),
      prefix: bulkPrefix,
      expiresAt: bulkExpiresAt ? new Date(bulkExpiresAt).toISOString() : null,
      usageLimitPerCode: bulkUsageLimit ? Number(bulkUsageLimit) : null,
    });

    setSaving(false);

    if (!result.success) {
      setError(result.error ?? "Could not generate codes.");
      return;
    }

    setGeneratedCodes(result.codes ?? []);
    setBulkDiscountValue("");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-4 sm:p-6">
        <div className="mb-4 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setMode("single")}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
              mode === "single" ? "bg-espresso text-cream" : "border border-espresso/20 text-espresso"
            }`}
          >
            Single Code
          </button>
          <button
            onClick={() => setMode("bulk")}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
              mode === "bulk" ? "bg-espresso text-cream" : "border border-espresso/20 text-espresso"
            }`}
          >
            Mass Generate
          </button>
        </div>

        {mode === "single" ? (
          <form onSubmit={handleCreate}>
            <h2 className="mb-4 font-display text-lg text-espresso">Create a Code</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-espresso">Code</label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full min-w-0 rounded-lg border border-espresso/15 px-4 py-2.5 text-sm uppercase focus:border-caramel focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setCode(randomCode())}
                    className="shrink-0 rounded-lg border border-espresso/20 px-3 py-2 text-xs text-espresso hover:bg-espresso/5"
                  >
                    Randomize
                  </button>
                </div>
              </div>

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
                  Usage limit — total (optional)
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

            <p className="mt-3 text-xs text-rich/50">
              This code automatically works on any product carrying a
              matching discount tier — set tiers from that product's own
              edit page.
            </p>

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
            )}

            <Button type="submit" className="mt-4 w-full sm:w-auto" disabled={saving}>
              {saving ? "Creating…" : "Create Code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleBulkGenerate}>
            <h2 className="mb-1 font-display text-lg text-espresso">Mass Generate Codes</h2>
            <p className="mb-4 text-xs text-rich/50">
              Pick a discount and how many unique codes to create at once —
              e.g. 50 separate 15%-off codes, each usable once, ready to
              hand out individually.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-espresso">Type</label>
                <select
                  value={bulkDiscountType}
                  onChange={(e) => setBulkDiscountType(e.target.value as any)}
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
                  value={bulkDiscountValue}
                  onChange={(e) => setBulkDiscountValue(e.target.value)}
                  placeholder={bulkDiscountType === "percentage" ? "15" : "2000"}
                  className="w-full rounded-lg border border-espresso/15 px-3 py-2.5 text-sm focus:border-caramel focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-espresso">
                  How many codes?
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  required
                  value={bulkQuantity}
                  onChange={(e) => setBulkQuantity(e.target.value)}
                  className="w-full rounded-lg border border-espresso/15 px-3 py-2.5 text-sm focus:border-caramel focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-espresso">
                  Code prefix
                </label>
                <input
                  value={bulkPrefix}
                  onChange={(e) => setBulkPrefix(e.target.value.toUpperCase())}
                  placeholder="ROYAL"
                  className="w-full rounded-lg border border-espresso/15 px-3 py-2.5 text-sm uppercase focus:border-caramel focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-espresso">
                  Expires (optional)
                </label>
                <input
                  type="date"
                  value={bulkExpiresAt}
                  onChange={(e) => setBulkExpiresAt(e.target.value)}
                  className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-espresso">
                  Uses per code
                </label>
                <input
                  type="number"
                  min={1}
                  value={bulkUsageLimit}
                  onChange={(e) => setBulkUsageLimit(e.target.value)}
                  className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
                />
                <p className="mt-1 text-xs text-rich/50">
                  Defaults to 1 — each generated code works once, since
                  they're meant to be handed to different people.
                </p>
              </div>
            </div>

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
            )}

            <Button type="submit" className="mt-4 w-full sm:w-auto" disabled={saving}>
              {saving ? "Generating…" : "Generate Codes"}
            </Button>

            {generatedCodes && generatedCodes.length > 0 && (
              <div className="mt-4 rounded-lg border border-espresso/10 bg-cream/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-espresso">
                    {generatedCodes.length} codes generated
                  </p>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(generatedCodes.join("\n"))}
                    className="text-xs text-caramel underline"
                  >
                    Copy all
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto font-mono text-xs text-rich/70">
                  {generatedCodes.map((c) => (
                    <div key={c}>{c}</div>
                  ))}
                </div>
              </div>
            )}
          </form>
        )}
      </div>

      <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-4 sm:p-6">
        <h2 className="mb-4 font-display text-lg text-espresso">All Codes</h2>
        <p className="mb-4 text-xs text-rich/50">
          Every code is also limited to one redemption per customer email,
          automatically — regardless of the total usage limit.
        </p>
        <div className="space-y-2">
          {codes.length === 0 && <p className="text-sm text-rich/50">No codes yet.</p>}
          {codes.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-2 rounded-xl border border-espresso/10 bg-cream/60 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="break-all font-mono font-medium text-espresso">{c.code}</p>
                <p className="text-xs text-rich/50">
                  {c.discount_type === "percentage" ? `${c.discount_value}% off` : `₦${c.discount_value.toLocaleString()} off`}
                  {" · "}
                  Used {c.times_used}
                  {c.usage_limit ? `/${c.usage_limit}` : ""}
                  {c.expires_at ? ` · Expires ${new Date(c.expires_at).toLocaleDateString()}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
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
