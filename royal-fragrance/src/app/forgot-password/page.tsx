"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/content/client";

export default function ForgotPasswordPage() { const _t = useT();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  }

  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-cream px-5 py-16">
      <div className="w-full max-w-md rounded-xl2 border border-espresso/10 bg-white/60 p-8 shadow-premium-sm">
        <h1 className="font-display text-2xl text-espresso">{_t("forgotpassword.20553f", "Reset Your Password")}</h1>

        {sent ? (
          <p className="mt-4 text-sm text-rich/70">{_t("forgotpassword.e7fddc", "If an account exists for")}{" "}<strong>{email}</strong>{_t("forgotpassword.b35860", ", a password reset link has been sent — check your inbox (and spam folder).")}</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-rich/70">{_t("forgotpassword.e6670f", "Enter your email and we'll send you a link to set a new password.")}</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-espresso">{_t("forgotpassword.84add5", "Email")}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? _t("forgotpassword.cf7655", "Sending…") : _t("forgotpassword.987be4", "Send Reset Link")}
              </Button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-rich/70">
          <Link href="/login" className="text-caramel underline">{_t("forgotpassword.4da821", "Back to sign in")}</Link>
        </p>
      </div>
    </section>
  );
}
