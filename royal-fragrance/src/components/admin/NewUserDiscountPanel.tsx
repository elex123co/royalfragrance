"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { updateNewUserDiscountSettings } from "@/lib/actions/admin-new-user-discount";

interface Settings {
  enabled: boolean;
  discount_percentage: number;
  expires_at: string | null;
}

export function NewUserDiscountPanel({ settings }: { settings: Settings | null }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(settings?.enabled ?? false);
  const [percentage, setPercentage] = useState(String(settings?.discount_percentage ?? 10));
  const [expiresAt, setExpiresAt] = useState(
    settings?.expires_at ? settings.expires_at.slice(0, 10) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await updateNewUserDiscountSettings({
      enabled,
      discountPercentage: Number(percentage),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    });
    setSaving(false);
    if (!result.success) {
      setError(result.error ?? "Could not save.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg text-espresso">
            New Customer First-Order Discount
          </h2>
          <p className="text-sm text-rich/60">
            Automatic — no code needed. Applies once per account, on their
            first order only.
          </p>
        </div>
        <button
          onClick={() => setEnabled((v) => !v)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${
            enabled ? "bg-espresso" : "bg-espresso/20"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-cream transition ${
              enabled ? "left-6" : "left-1"
            }`}
          />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-espresso">
            Discount percentage
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-espresso">
            Ends on (optional)
          </label>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
          />
          <p className="mt-1 text-xs text-rich/50">
            Leave blank to run indefinitely while the toggle above is on.
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <Button className="mt-4 w-full sm:w-auto" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
