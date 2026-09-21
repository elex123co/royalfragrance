import type { Handler } from "@netlify/functions";
import { createStandaloneAdminClient } from "./_shared/admin-client";
import { runNewsletterCycle } from "../../src/lib/newsletter/run";

// Converted from Netlify's native scheduled-function trigger to a plain
// HTTP endpoint, called by an external cron service instead — Netlify's
// own scheduler has a currently-known, actively-reported reliability
// issue where registered scheduled functions silently never fire despite
// showing correctly in the dashboard. This sidesteps that entirely.
export const handler: Handler = async (event) => {
  const secret = event.queryStringParameters?.secret;
  if (!secret || secret !== process.env.NEWSLETTER_CRON_SECRET) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  const supabase = createStandaloneAdminClient();
  const result = await runNewsletterCycle(supabase, "monday");
  console.log("Monday newsletter cycle:", result);
  return { statusCode: 200, body: JSON.stringify(result) };
};
