"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function Newsletter({ texts }: { texts: Record<"title" | "text" | "placeholder" | "btn" | "success" | "error", string> }) {
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
          {texts.title}
        </h2>
        <p className="mt-3 text-sm text-cream/70">
          {texts.text}
        </p>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
        >
          <input
            type="email"
            required
            placeholder={texts.placeholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-full border border-cream/20 bg-cream/5 px-5 py-3 text-sm text-cream placeholder:text-cream/40 focus:border-caramel focus:outline-none"
          />
          <Button type="submit" variant="secondary" disabled={status === "loading"}>
            {status === "loading" ? "..." : texts.btn}
          </Button>
        </form>

        {status === "success" && (
          <p className="mt-3 text-xs text-caramel">{texts.success}</p>
        )}
        {status === "error" && (
          <p className="mt-3 text-xs text-red-300">
            {texts.error}
          </p>
        )}
      </div>
    </section>
  );
}
