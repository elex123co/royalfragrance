"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

async function handleLogout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  // A hard navigation, not router.push — Next's client-side Router
  // Cache can otherwise keep serving a previous session's rendered
  // pages after switching accounts, which is exactly what caused
  // "stuck in normal user features until I clear cache."
  window.location.href = "/";
}

export function LogoutButton() {
  return (
    <button
      onClick={handleLogout}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-cream/60 transition hover:bg-cream/5 hover:text-cream"
    >
      <LogOut size={16} />
      Logout
    </button>
  );
}

/**
 * Compact icon-only logout — for the mobile dashboard header, where the
 * full logout was previously only reachable by tapping "More" in the
 * bottom nav first, and wasn't obvious to find.
 */
export function LogoutIconButton({ className = "" }: { className?: string }) {
  return (
    <button
      onClick={handleLogout}
      aria-label="Logout"
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-cream/10 text-cream transition hover:bg-cream/20 ${className}`}
    >
      <LogOut size={16} />
    </button>
  );
}
