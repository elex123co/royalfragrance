import { createClient } from "@supabase/supabase-js";
import WS from "ws";

// @supabase/supabase-js unconditionally constructs a Realtime (WebSocket)
// client the moment createClient() is called — even though this project
// never uses realtime features — and Netlify's Functions runtime doesn't
// expose a native WebSocket global the way a newer Node version would.
// That crashed every scheduled newsletter run before it could even reach
// our own code ("Node.js detected but native WebSocket not found").
// Polyfilling it here fixes that regardless of the underlying Node version.
if (typeof globalThis.WebSocket === "undefined") {
  (globalThis as any).WebSocket = WS;
}

// Netlify Functions run outside the Next.js runtime, so this deliberately
// does NOT import from src/lib/supabase/server.ts (which pulls in
// next/headers). Same service-role pattern, standalone.
export function createStandaloneAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
