"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { updateOwnBvnNin } from "@/lib/actions/vendor-profile";

export function BvnNinForm() {
  const router = useRouter();
  const [bvn, setBvn] = useState("");
  const [nin, setNin] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const result = await updateOwnBvnNin(bvn, nin);

    setSaving(false);

    if (!result.success) {
      setError(result.error ?? "Could not save.");
      return;
    }

    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md rounded-xl2 border border-caramel/40 bg-caramel/5 p-6"
    >
      <p className="mb-1 font-display text-lg text-espresso">
        One more thing before your account is ready
      </p>
      <p className="mb-4 text-sm text-rich/70">
        Your collection account can't be created yet — we're required to
        link a BVN or NIN to it for compliance. Enter at least one below.
      </p>

      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-espresso">BVN</label>
          <input
            value={bvn}
            onChange={(e) => setBvn(e.target.value)}
            maxLength={11}
            placeholder="11-digit BVN"
            className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-espresso">NIN</label>
          <input
            value={nin}
            onChange={(e) => setNin(e.target.value)}
            maxLength={11}
            placeholder="11-digit NIN"
            className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
          />
        </div>
      </div>

      <p className="mt-2 text-xs text-rich/50">At least one of these is required.</p>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <Button type="submit" className="mt-4 w-full" disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
