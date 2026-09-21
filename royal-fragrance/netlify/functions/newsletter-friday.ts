import type { Handler } from "@netlify/functions";
import { createStandaloneAdminClient } from "./_shared/admin-client";
import { runNewsletterCycle } from "../../src/lib/newsletter/run";

export const handler: Handler = async (event) => {
  const secret = event.queryStringParameters?.secret;
  if (!secret || secret !== process.env.NEWSLETTER_CRON_SECRET) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  const supabase = createStandaloneAdminClient();
  const result = await runNewsletterCycle(supabase, "friday");
  console.log("Friday newsletter cycle:", result);
  return { statusCode: 200, body: JSON.stringify(result) };
};
