"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { name: form.name, phone: form.phone, role: "customer" },
      },
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    // When email confirmation is required, Supabase returns a user but no
    // session yet — there's nothing to log into until they click the link
    // in their inbox. Redirecting to the dashboard here would just bounce
    // them straight back out with no explanation, which is exactly what
    // was happening before this fix.
    if (!data.session) {
      setAwaitingConfirmation(true);
      return;
    }

    // Confirmation isn't required on this project — a session came back
    // immediately, so log them straight in.
    window.location.href = "/account";
  }

  if (awaitingConfirmation) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center bg-cream px-5 py-16">
        <div className="w-full max-w-md rounded-xl2 border border-espresso/10 bg-white/60 p-8 text-center shadow-premium-sm">
          <Mail className="mx-auto text-caramel" size={40} />
          <h1 className="mt-4 font-display text-2xl text-espresso">
            Check Your Email
          </h1>
          <p className="mt-3 text-sm text-rich/70">
            We've sent a confirmation link to <strong>{form.email}</strong>.
            Click it to activate your account, then come back and sign in.
          </p>
          <p className="mt-4 text-xs text-rich/50">
            Didn't get it? Check spam, or{" "}
            <button
              onClick={() => setAwaitingConfirmation(false)}
              className="text-caramel underline"
            >
              try again
            </button>
            .
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-cream px-5 py-16">
      <div className="w-full max-w-md rounded-xl2 border border-espresso/10 bg-white/60 p-8 shadow-premium-sm">
        <h1 className="font-display text-2xl text-espresso">Create Your Account</h1>
        <p className="mt-2 text-sm text-rich/70">
          Join Royal Fragrance for a faster, personalized experience.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-espresso">
              Full Name
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-espresso">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-espresso">
              Phone Number
            </label>
            <input
              required
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-espresso">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create Account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-rich/70">
          Already have an account?{" "}
          <Link href="/login" className="text-caramel underline">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
