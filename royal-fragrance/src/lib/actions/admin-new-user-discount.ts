"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "./require-admin";

export interface NewUserDiscountSettingsInput {
  enabled: boolean;
  discountPercentage: number;
  expiresAt: string | null;
}

export async function updateNewUserDiscountSettings(input: NewUserDiscountSettingsInput) {
  const { admin } = await requireAdmin();

  if (input.discountPercentage < 0 || input.discountPercentage > 100) {
    return { success: false, error: "Percentage must be between 0 and 100." };
  }

  const { error } = await admin
    .from("new_user_discount_settings")
    .update({
      enabled: input.enabled,
      discount_percentage: input.discountPercentage,
      expires_at: input.expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/promo-codes");
  revalidatePath("/checkout");
  return { success: true };
}
