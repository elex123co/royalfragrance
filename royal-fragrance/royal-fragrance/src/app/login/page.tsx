"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: signInData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (authError || !signInData.user) {
      setLoading(false);
      setError(authError?.message ?? "Sign in failed");
      return;
    }

    // Route by actual role rather than always landing on /account — an
    // explicit ?redirect= (set by middleware when a protected page bounced
    // you to /login) always wins over the role default.
    const explicitRedirect = searchParams.get("redirect");
    if (explicitRedirect) {
      router.push(explicitRedirect);
      router.refresh();
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", signInData.user.id)
      .single();

    setLoading(false);

    const destination =
      profile?.role === "admin"
        ? "/admin"
        : profile?.role === "vendor"
          ? "/vendor"
          : "/account";

    router.push(destination);
    router.refresh();
  }

  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-cream px-5 py-16">
      <div className="w-full max-w-md rounded-xl2 border border-espresso/10 bg-white/60 p-8 shadow-premium-sm">
        <h1 className="font-display text-2xl text-espresso">Welcome Back</h1>
        <p className="mt-2 text-sm text-rich/70">
          Sign in to your Royal Fragrance account.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-espresso">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-rich/70">
          Don&rsquo;t have an account?{" "}
          <Link href="/register" className="text-caramel underline">
            Create one
          </Link>
        </p>
      </div>
    </section>
  );
}
