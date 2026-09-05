"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // A hard navigation, not router.push — Next's client-side Router
    // Cache can otherwise keep serving a previous session's rendered
    // pages after switching accounts, which is exactly what caused
    // "stuck in normal user features until I clear cache."
    window.location.href = "/";
  }

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
