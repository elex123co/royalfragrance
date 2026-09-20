import { createClient, createAdminClient } from "@/lib/supabase/server";

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

/**
 * Checks whether the CURRENTLY LOGGED-IN customer specifically qualifies
 * for the new-customer discount right now — not just whether the feature
 * is globally enabled, but whether this exact account has zero prior paid
 * orders. Used to make the checkout page's displayed total honest before
 * submission, instead of only showing an informational banner while the
 * real discount is silently computed later at order-creation time.
 */
export async function getPersonalizedNewUserDiscount(): Promise<{
  eligible: boolean;
  percentage: number;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { eligible: false, percentage: 0 };

  const admin = createAdminClient();
  const { data: settings } = await admin
    .from("new_user_discount_settings")
    .select("enabled, discount_percentage, expires_at")
    .eq("id", 1)
    .maybeSingle();

  if (!settings?.enabled) return { eligible: false, percentage: 0 };
  if (settings.expires_at && new Date(settings.expires_at) < new Date()) {
    return { eligible: false, percentage: 0 };
  }

  const { count } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", user.id)
    .eq("payment_status", "paid");

  if ((count ?? 0) > 0) return { eligible: false, percentage: 0 };

  return { eligible: true, percentage: Number(settings.discount_percentage) };
}
