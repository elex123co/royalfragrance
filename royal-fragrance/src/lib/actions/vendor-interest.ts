"use server";

import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { sendVendorApplicationLinkEmail } from "@/lib/email/resend";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://royalfragrancegallery.com";

export async function requestVendorApplicationLink(email: string) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) {
    return { success: false, error: "Enter a valid email address." };
  }

  const supabase = createAdminClient();
  const token = randomBytes(24).toString("hex");

  const { error } = await supabase.from("vendor_interest_signups").insert({
    email: trimmed,
    token,
  });

  if (error) {
    return { success: false, error: "Could not process your request. Please try again." };
  }

  const applyUrl = `${SITE_URL}/become-a-vendor/apply?token=${token}`;
  await sendVendorApplicationLinkEmail(trimmed, applyUrl);

  return { success: true };
}

export interface TokenCheckResult {
  valid: boolean;
  email?: string;
}

/**
 * Validates a token and, if valid and unused, immediately marks it used —
 * a link is meant to be opened once. This happens on page load (access
 * gate), independent of whether the visitor goes on to actually submit
 * the application form.
 */
export async function validateAndConsumeVendorToken(token: string): Promise<TokenCheckResult> {
  if (!token) return { valid: false };

  const supabase = createAdminClient();
  const { data: signup } = await supabase
    .from("vendor_interest_signups")
    .select("id, email, used")
    .eq("token", token)
    .maybeSingle();

  if (!signup || signup.used) return { valid: false };

  await supabase.from("vendor_interest_signups").update({ used: true }).eq("id", signup.id);

  return { valid: true, email: signup.email };
}
