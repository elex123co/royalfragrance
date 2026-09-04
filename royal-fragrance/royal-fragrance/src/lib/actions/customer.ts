"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

export async function toggleWishlist(productId: string) {
  const { supabase, userId } = await requireUser();

  const { data: existing } = await supabase
    .from("wishlist_items")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    await supabase.from("wishlist_items").delete().eq("id", existing.id);
    revalidatePath("/account/wishlist");
    revalidatePath("/account");
    return { success: true, wishlisted: false };
  }

  const { error } = await supabase
    .from("wishlist_items")
    .insert({ user_id: userId, product_id: productId });

  if (error) return { success: false, error: error.message };

  revalidatePath("/account/wishlist");
  revalidatePath("/account");
  return { success: true, wishlisted: true };
}

export interface AddressInput {
  label: string;
  state: string;
  city: string;
  address: string;
  isDefault: boolean;
}

export async function saveAddress(input: AddressInput) {
  const { supabase, userId } = await requireUser();

  if (input.isDefault) {
    await supabase
      .from("customer_addresses")
      .update({ is_default: false })
      .eq("user_id", userId);
  }

  const { error } = await supabase.from("customer_addresses").insert({
    user_id: userId,
    label: input.label,
    state: input.state,
    city: input.city,
    address: input.address,
    is_default: input.isDefault,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/account/addresses");
  return { success: true };
}

export async function deleteAddress(addressId: string) {
  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("customer_addresses")
    .delete()
    .eq("id", addressId)
    .eq("user_id", userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/account/addresses");
  return { success: true };
}

export interface ScentProfileInput {
  preferredFamilies: string[];
  occasions: string[];
  intensity: string;
}

export async function saveScentProfile(input: ScentProfileInput) {
  const { supabase, userId } = await requireUser();

  const { error } = await supabase.from("scent_profiles").upsert({
    user_id: userId,
    preferred_families: input.preferredFamilies,
    occasions: input.occasions,
    intensity: input.intensity,
    updated_at: new Date().toISOString(),
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/account/scent-profile");
  revalidatePath("/account");
  return { success: true };
}

export interface ProfileInput {
  name: string;
  phone: string;
}

export async function updateProfile(input: ProfileInput) {
  const { supabase, userId } = await requireUser();

  const { error } = await supabase
    .from("users")
    .update({ name: input.name, phone: input.phone })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/account/settings");
  revalidatePath("/account");
  return { success: true };
}

export async function markNotificationRead(notificationId: string) {
  const { supabase, userId } = await requireUser();

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", userId);

  revalidatePath("/account/notifications");
  return { success: true };
}

export async function markAllNotificationsRead() {
  const { supabase, userId } = await requireUser();

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);

  revalidatePath("/account/notifications");
  return { success: true };
}
