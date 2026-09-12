import type { SupabaseClient } from "@supabase/supabase-js";
import { applyDiscount } from "@/lib/utils/discount";

export interface PromoValidationResult {
  valid: boolean;
  error?: string;
  promoCodeId?: string;
  discountAmount?: number;
}

/**
 * Shared by both the checkout "Apply" button (live feedback) and the
 * checkout API route (authoritative re-check at order-creation time) —
 * one source of truth so a tampered client-side discount can never be
 * trusted into an actual order.
 */
export async function validatePromoCodeServerSide(
  supabase: SupabaseClient,
  code: string,
  subtotal: number
): Promise<PromoValidationResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { valid: false, error: "Enter a code." };

  const { data: promo } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("code", normalized)
    .maybeSingle();

  if (!promo) return { valid: false, error: "Invalid code." };
  if (!promo.active) return { valid: false, error: "This code is no longer active." };
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return { valid: false, error: "This code has expired." };
  }
  if (promo.usage_limit != null && promo.times_used >= promo.usage_limit) {
    return { valid: false, error: "This code has reached its usage limit." };
  }

  const discountedTotal = applyDiscount(subtotal, promo.discount_type, Number(promo.discount_value));
  const discountAmount = subtotal - discountedTotal;

  return { valid: true, promoCodeId: promo.id, discountAmount };
}
