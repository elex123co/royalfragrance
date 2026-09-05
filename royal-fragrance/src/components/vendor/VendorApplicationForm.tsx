"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { applyAsVendor } from "@/lib/actions/vendor-application";

export function VendorApplicationForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    notes: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const result = await applyAsVendor(form);

    if (!result.success) {
      setStatus("error");
      setError(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    setStatus("success");
    setTimeout(() => router.push("/login"), 2500);
  }

  if (status === "success") {
    return (
      <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-8 text-center shadow-premium-sm">
        <h3 className="font-display text-xl text-espresso">
          Application Submitted
        </h3>
        <p className="mt-2 text-sm text-rich/70">
          We&rsquo;ll review your application and notify you once approved.
          Redirecting you to sign in…
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl2 border border-espresso/10 bg-white/60 p-6 shadow-premium-sm sm:p-8"
    >
      <h2 className="font-display text-lg text-espresso">Vendor Application</h2>

      <Field
        label="Full Name"
        value={form.fullName}
        onChange={(v) => setForm((f) => ({ ...f, fullName: v }))}
      />
      <Field
        label="Email"
        type="email"
        value={form.email}
        onChange={(v) => setForm((f) => ({ ...f, email: v }))}
      />
      <Field
        label="Phone Number"
        value={form.phone}
        onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
      />
      <Field
        label="Password"
        type="password"
        value={form.password}
        onChange={(v) => setForm((f) => ({ ...f, password: v }))}
      />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-espresso">
          Tell us about your sales network
        </label>
        <textarea
          required
          rows={3}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={status === "loading"}>
        {status === "loading" ? "Submitting…" : "Submit Application"}
      </Button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-espresso">
        {label}
      </label>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
      />
    </div>
  );
}
