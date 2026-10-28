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

/**
 * Lets a vendor choose the name customers see, such as "Shop with ___" on
 * their personal storefront, instead of their registered full name.
 */
export async function updateOwnDisplayName(displayName: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not signed in." };

  const name = displayName.replace(/\s+/g, " ").trim();
  if (name.length > 0 && (name.length < 2 || name.length > 40)) {
    return { success: false, error: "Use between 2 and 40 characters." };
  }

  const admin = createAdminClient();
  const { data: vendor } = await admin
    .from("vendors")
    .select("vendor_code")
    .eq("user_id", user.id)
    .single();

  const { error } = await admin
    .from("vendors")
    .update({ display_name: name || null })
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/vendor/profile");
  revalidatePath("/vendor");
  if (vendor?.vendor_code) revalidatePath(`/store/${vendor.vendor_code}`);
  return { success: true };
}
