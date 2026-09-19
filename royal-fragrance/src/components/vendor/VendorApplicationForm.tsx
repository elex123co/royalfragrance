"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { applyAsVendor } from "@/lib/actions/vendor-application";
import { trackMetaEvent } from "@/components/analytics/MetaPixel";

const PLATFORMS = ["Instagram", "TikTok", "X (Twitter)", "Facebook", "YouTube", "WhatsApp Status", "Other"];

export function VendorApplicationForm({ initialEmail }: { initialEmail?: string } = {}) {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: initialEmail ?? "",
    phone: "",
    password: "",
    notes: "",
    isStudent: false,
    university: "",
    primaryPlatform: PLATFORMS[0],
    audienceSize: "",
    promotionCommitment: false,
    bvn: "",
    nin: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.promotionCommitment) {
      setError("Please confirm you're willing to actively promote our products.");
      return;
    }
    setStatus("loading");
    setError(null);

    const result = await applyAsVendor(form);

    if (!result.success) {
      setStatus("error");
      setError(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    setStatus("success");
    trackMetaEvent("Lead", { content_name: "Vendor Application" });
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
      <h2 className="font-display text-lg text-espresso">Vendor & Ambassador Application</h2>

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

      <label className="flex items-center gap-2 text-sm text-rich/80">
        <input
          type="checkbox"
          checked={form.isStudent}
          onChange={(e) => setForm((f) => ({ ...f, isStudent: e.target.checked }))}
        />
        I'm currently a student
      </label>

      {form.isStudent && (
        <Field
          label="Which university?"
          value={form.university}
          onChange={(v) => setForm((f) => ({ ...f, university: v }))}
        />
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-espresso">
          Where do you have the most influence?
        </label>
        <select
          value={form.primaryPlatform}
          onChange={(e) => setForm((f) => ({ ...f, primaryPlatform: e.target.value }))}
          className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <Field
        label="Roughly how many people can you reach there? (e.g. followers, group size)"
        value={form.audienceSize}
        onChange={(v) => setForm((f) => ({ ...f, audienceSize: v }))}
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

      <div>
        <label className="mb-1.5 block text-sm font-medium text-espresso">
          BVN or NIN (optional)
        </label>
        <p className="mb-2 text-xs text-rich/50">
          Only needed if you're approved for a personal collection account
          to receive customer payments directly — you can add this later
          from your dashboard if you'd rather skip it for now.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <input
            value={form.bvn}
            onChange={(e) => setForm((f) => ({ ...f, bvn: e.target.value }))}
            placeholder="BVN"
            maxLength={11}
            className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
          />
          <input
            value={form.nin}
            onChange={(e) => setForm((f) => ({ ...f, nin: e.target.value }))}
            placeholder="NIN"
            maxLength={11}
            className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
          />
        </div>
      </div>

      <label className="flex items-start gap-2 text-sm text-rich/80">
        <input
          type="checkbox"
          className="mt-1"
          checked={form.promotionCommitment}
          onChange={(e) => setForm((f) => ({ ...f, promotionCommitment: e.target.checked }))}
        />
        I commit to actively promoting Royal Fragrance products on the
        platform I selected above, not just selling passively.
      </label>

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
      {type === "password" ? (
        <PasswordInput required value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input
          type={type}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
        />
      )}
    </div>
  );
}
