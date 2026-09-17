import { createClient } from "@/lib/supabase/server";

/**
 * Returns the new-customer discount percentage if it's currently enabled
 * and not past its optional end date, otherwise null. Used to show a
 * visible "new customers get X% off" callout on every product — this is
 * a marketing display, separate from the actual eligibility check that
 * runs again, authoritatively, at checkout.
 */
export async function getActiveNewUserDiscountPercent(): Promise<number | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("new_user_discount_settings")
      .select("enabled, discount_percentage, expires_at")
      .eq("id", 1)
      .maybeSingle();

    if (!data?.enabled) return null;
    if (data.expires_at && new Date(data.expires_at) < new Date()) return null;

    return Number(data.discount_percentage);
  } catch {
    return null;
  }
}
