import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const newsletterId = searchParams.get("newsletter");
  const choice = searchParams.get("choice");
  const email = searchParams.get("email");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://royalfragrance.netlify.app";

  if (!newsletterId || !choice || !email) {
    return NextResponse.redirect(`${siteUrl}/newsletter/${newsletterId ?? ""}?voted=error`);
  }

  const supabase = createAdminClient();

  // Unique constraint on (newsletter_id, voter_email) makes this
  // idempotent — clicking twice or from two links doesn't double-count.
  await supabase
    .from("newsletter_votes")
    .upsert(
      { newsletter_id: newsletterId, choice, voter_email: email },
      { onConflict: "newsletter_id,voter_email" }
    );

  return NextResponse.redirect(`${siteUrl}/newsletter/${newsletterId}?voted=${encodeURIComponent(choice)}`);
}
