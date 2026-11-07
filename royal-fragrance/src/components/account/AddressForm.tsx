"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { saveAddress } from "@/lib/actions/customer";
import { useT } from "@/lib/content/client";

export function AddressForm() { const _t = useT();
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
      <Button variant="outline" className="border-espresso/20 text-espresso" onClick={() => setOpen(true)}>{_t("account.addressform.2b9f8b", "+ Add New Address")}</Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl2 border border-espresso/10 bg-white/60 p-5"
    >
      <input
        placeholder={_t("account.addressform.903195", "Label (e.g. Home, Office)")}
        required
        value={form.label}
        onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
        className="w-full rounded-lg border border-espresso/15 px-3 py-2 text-sm"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder={_t("account.addressform.a72502", "State")}
          required
          value={form.state}
          onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
          className="rounded-lg border border-espresso/15 px-3 py-2 text-sm"
        />
        <input
          placeholder={_t("account.addressform.427162", "City")}
          required
          value={form.city}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          className="rounded-lg border border-espresso/15 px-3 py-2 text-sm"
        />
      </div>
      <textarea
        placeholder={_t("account.addressform.9f8ce1", "Full address")}
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
        />{_t("account.addressform.b62ebb", "Set as default address")}</label>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="border-espresso/20 text-espresso"
          onClick={() => setOpen(false)}
        >{_t("account.addressform.77dfd2", "Cancel")}</Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? _t("account.addressform.56a228", "Saving…") : _t("account.addressform.4aa8d2", "Save Address")}
        </Button>
      </div>
    </form>
  );
}
