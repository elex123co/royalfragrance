"use client";

import { useState } from "react";
import { requestVendorApplicationLink } from "@/lib/actions/vendor-interest";

export function VendorInterestForm() {
  const [interested, setInterested] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!interested) return;

    setStatus("loading");
    setError(null);

    const result = await requestVendorApplicationLink(email);

    if (!result.success) {
      setStatus("error");
      setError(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-8 text-center shadow-premium-sm">
        <h3 className="font-display text-xl text-espresso">Check Your Email</h3>
        <p className="mt-2 text-sm text-rich/70">
          We've sent an application link to <strong>{email}</strong>. Open
          it to fill in your details — the link works once, so keep this
          email safe.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl2 border border-espresso/10 bg-white/60 p-8 shadow-premium-sm"
    >
      <h3 className="font-display text-xl text-espresso">Interested?</h3>
      <p className="mt-2 text-sm text-rich/70">
        Tell us you're interested and we'll send your application link by
        email — it only takes a moment.
      </p>

      <label className="mt-5 flex items-start gap-2 text-sm text-rich/80">
        <input
          type="checkbox"
          className="mt-1"
          checked={interested}
          onChange={(e) => setInterested(e.target.checked)}
        />
        I'm interested in becoming a Royal Fragrance vendor.
      </label>

      {interested && (
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-espresso">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
          />
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={!interested || status === "loading"}
        className="mt-5 w-full rounded-full bg-espresso px-6 py-3 text-sm text-cream hover:bg-rich disabled:cursor-not-allowed disabled:opacity-40"
      >
        {status === "loading" ? "Sending…" : "Send Me the Application Link"}
      </button>
    </form>
  );
}
