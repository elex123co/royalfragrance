"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { updateProfile } from "@/lib/actions/customer";

export function SettingsForm({
  initialName,
  initialPhone,
  email,
}: {
  initialName: string;
  initialPhone: string;
  email: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSaved(false);
    setError(null);

    const result = await updateProfile({ name, phone });

    setSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Could not save changes. Please try again.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md space-y-4 rounded-xl2 border border-espresso/10 bg-white/60 p-6"
    >
      <div>
        <label className="mb-1.5 block text-sm font-medium text-espresso">
          Full Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-espresso">
          Email
        </label>
        <input
          value={email}
          disabled
          className="w-full rounded-lg border border-espresso/10 bg-espresso/5 px-4 py-2.5 text-sm text-rich/50"
        />
        <p className="mt-1 text-xs text-rich/40">
          Contact support to change your email.
        </p>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-espresso">
          Phone Number
        </label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
        />
      </div>

      {saved && <p className="text-sm text-green-700">Saved.</p>}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Save Changes"}
      </Button>
    </form>
  );
}
