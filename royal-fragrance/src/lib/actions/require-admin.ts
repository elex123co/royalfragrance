import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * Verifies the current session belongs to an admin before letting a server
 * action proceed. Middleware already gates the /admin/* pages themselves,
 * but server actions can in principle be invoked directly, so this is
 * defense-in-depth rather than the only line of protection.
 */
export async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Not authorized");

  return { userId: user.id, admin };
}
