"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function updateOwnBvnNin(bvn: string, nin: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not signed in." };

  const trimmedBvn = bvn.trim();
  const trimmedNin = nin.trim();

  if (!trimmedBvn && !trimmedNin) {
    return { success: false, error: "Enter your BVN or your NIN — at least one is required." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("vendors")
    .update({
      bvn: trimmedBvn || null,
      nin: trimmedNin || null,
    })
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/vendor/collection-account");
  return { success: true };
}
