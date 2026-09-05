import { schedule } from "@netlify/functions";
import { createStandaloneAdminClient } from "./_shared/admin-client";
import { runNewsletterCycle } from "../../src/lib/newsletter/run";

async function run() {
  const supabase = createStandaloneAdminClient();
  const result = await runNewsletterCycle(supabase, "sunday");
  console.log("Sunday newsletter cycle:", result);
  return { statusCode: 200, body: JSON.stringify(result) };
}

// Cron is UTC. 17:00 UTC = 18:00 WAT (Africa/Lagos, no DST).
export const handler = schedule("0 17 * * 0", run);
