"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "./require-admin";

export interface CreatePromoCodeInput {
  code: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  expiresAt: string | null; // ISO date string or null
  usageLimit: number | null;
}

export async function createPromoCode(input: CreatePromoCodeInput) {
  const { admin } = await requireAdmin();

  const code = input.code.trim().toUpperCase();
  if (!code) return { success: false, error: "Enter a code." };
  if (!input.discountValue || input.discountValue <= 0) {
    return { success: false, error: "Enter a discount value greater than 0." };
  }

  const { error } = await admin.from("promo_codes").insert({
    code,
    discount_type: input.discountType,
    discount_value: input.discountValue,
    expires_at: input.expiresAt,
    usage_limit: input.usageLimit,
  });

  if (error) {
    return {
      success: false,
      error: error.code === "23505" ? "That code already exists." : error.message,
    };
  }

  revalidatePath("/admin/promo-codes");
  return { success: true };
}

export async function togglePromoCodeActive(id: string, active: boolean) {
  const { admin } = await requireAdmin();
  const { error } = await admin.from("promo_codes").update({ active }).eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/promo-codes");
  return { success: true };
}

export async function deletePromoCode(id: string) {
  const { admin } = await requireAdmin();
  const { error } = await admin.from("promo_codes").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/promo-codes");
  return { success: true };
}
