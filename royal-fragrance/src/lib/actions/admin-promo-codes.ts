"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "./require-admin";

export interface BulkCreatePromoCodesInput {
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  quantity: number;
  prefix: string;
  expiresAt: string | null;
  usageLimitPerCode: number | null;
}

function generateRandomSuffix() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function createPromoCodesBulk(input: BulkCreatePromoCodesInput) {
  const { admin } = await requireAdmin();

  if (!input.discountValue || input.discountValue <= 0) {
    return { success: false, error: "Enter a discount value greater than 0." };
  }
  if (!input.quantity || input.quantity < 1 || input.quantity > 500) {
    return { success: false, error: "Choose a quantity between 1 and 500." };
  }

  const prefix = (input.prefix.trim() || "ROYAL").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const codes = new Set<string>();
  // Generate more than needed and dedupe, in case of rare collisions —
  // codes are unique per the DB constraint, so a retry loop stays cheap.
  while (codes.size < input.quantity) {
    codes.add(`${prefix}-${generateRandomSuffix()}`);
  }

  const rows = [...codes].map((code) => ({
    code,
    discount_type: input.discountType,
    discount_value: input.discountValue,
    expires_at: input.expiresAt,
    usage_limit: input.usageLimitPerCode ?? 1,
  }));

  const { error } = await admin.from("promo_codes").insert(rows);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/promo-codes");
  return { success: true, codes: [...codes] };
}

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
