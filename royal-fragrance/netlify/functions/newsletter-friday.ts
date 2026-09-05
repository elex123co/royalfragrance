import { schedule } from "@netlify/functions";
import { createStandaloneAdminClient } from "./_shared/admin-client";
import { runNewsletterCycle } from "../../src/lib/newsletter/run";

async function run() {
  const supabase = createStandaloneAdminClient();
  const result = await runNewsletterCycle(supabase, "friday");
  console.log("Friday newsletter cycle:", result);
  return { statusCode: 200, body: JSON.stringify(result) };
}

// Cron is UTC. 09:00 UTC = 10:00 WAT (Africa/Lagos, no DST).
export const handler = schedule("0 9 * * 5", run);
