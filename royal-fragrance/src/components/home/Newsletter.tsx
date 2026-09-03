"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="bg-espresso py-20 text-cream">
      <div className="mx-auto max-w-2xl px-5 text-center lg:px-8">
        <h2 className="font-display text-2xl sm:text-3xl">
          Stay Ahead of the Fragrance
        </h2>
        <p className="mt-3 text-sm text-cream/70">
          New fragrances, launches, and future releases — straight to your
          inbox.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
        >
          <input
            type="email"
            required
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-full border border-cream/20 bg-cream/5 px-5 py-3 text-sm text-cream placeholder:text-cream/40 focus:border-caramel focus:outline-none"
          />
          <Button type="submit" variant="secondary" disabled={status === "loading"}>
            {status === "loading" ? "Subscribing…" : "Subscribe"}
          </Button>
        </form>

        {status === "success" && (
          <p className="mt-3 text-xs text-caramel">You&rsquo;re on the list.</p>
        )}
        {status === "error" && (
          <p className="mt-3 text-xs text-red-300">
            Something went wrong. Please try again.
          </p>
        )}
      </div>
    </section>
  );
}
