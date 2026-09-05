import { createClient } from "@supabase/supabase-js";

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
