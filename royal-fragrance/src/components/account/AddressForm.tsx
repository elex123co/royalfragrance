"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { saveAddress } from "@/lib/actions/customer";

export function AddressForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    label: "",
    state: "",
    city: "",
    address: "",
    isDefault: false,
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await saveAddress(form);
    setSubmitting(false);
    setForm({ label: "", state: "", city: "", address: "", isDefault: false });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button variant="outline" className="border-espresso/20 text-espresso" onClick={() => setOpen(true)}>
        + Add New Address
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl2 border border-espresso/10 bg-white/60 p-5"
    >
      <input
        placeholder="Label (e.g. Home, Office)"
        required
        value={form.label}
        onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
        className="w-full rounded-lg border border-espresso/15 px-3 py-2 text-sm"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder="State"
          required
          value={form.state}
          onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
          className="rounded-lg border border-espresso/15 px-3 py-2 text-sm"
        />
        <input
          placeholder="City"
          required
          value={form.city}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          className="rounded-lg border border-espresso/15 px-3 py-2 text-sm"
        />
      </div>
      <textarea
        placeholder="Full address"
        required
        rows={2}
        value={form.address}
        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
        className="w-full rounded-lg border border-espresso/15 px-3 py-2 text-sm"
      />
      <label className="flex items-center gap-2 text-sm text-rich/70">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
        />
        Set as default address
      </label>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="border-espresso/20 text-espresso"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save Address"}
        </Button>
      </div>
    </form>
  );
}
