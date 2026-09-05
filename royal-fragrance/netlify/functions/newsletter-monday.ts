import { schedule } from "@netlify/functions";
import { createStandaloneAdminClient } from "./_shared/admin-client";
import { runNewsletterCycle } from "../../src/lib/newsletter/run";

async function run() {
  const supabase = createStandaloneAdminClient();
  const result = await runNewsletterCycle(supabase, "monday");
  console.log("Monday newsletter cycle:", result);
  return { statusCode: 200, body: JSON.stringify(result) };
}

// Cron is UTC. 07:00 UTC = 08:00 WAT (Africa/Lagos, no DST). Changing the
// actual send time requires editing this cron string and redeploying —
// see the note in /admin/newsletter about this limitation.
export const handler = schedule("0 7 * * 1", run);
