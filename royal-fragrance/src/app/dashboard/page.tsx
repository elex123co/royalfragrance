import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * The navbar's account icon points here instead of straight to /account.
 * /account always rendered the customer dashboard for anyone logged in,
 * regardless of role — meaning an admin who navigated away and tapped the
 * profile icon again would land back on the customer view instead of
 * /admin. This route checks the real role every time and sends each
 * person to their actual home area.
 */
export default async function DashboardRedirectPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/dashboard");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") redirect("/admin");
  if (profile?.role === "vendor") redirect("/vendor");
  redirect("/account");
}
