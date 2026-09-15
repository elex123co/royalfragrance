import type { SupabaseClient } from "@supabase/supabase-js";
import { applyDiscount } from "@/lib/utils/discount";

export interface PromoValidationResult {
  valid: boolean;
  error?: string;
  promoCodeId?: string;
  discountAmount?: number;
}

export interface CartItemForPromo {
  productId: string;
  price: number;
  quantity: number;
}

/**
 * Shared by both the checkout "Apply" button (live feedback) and the
 * checkout API route (authoritative re-check at order-creation time) —
 * one source of truth so a tampered client-side discount can never be
 * trusted into an actual order.
 *
 * A promo code is a generic "X% off" or "₦Y off" key. It automatically
 * applies to any cart item whose product has a matching discount tier
 * (same type + same value) in product_discount_tiers — a product can
 * carry several tiers (e.g. both 10% and 15%), and each tier's matching
 * code unlocks it independently. There's no per-code product picking.
 *
 * customerEmail is required and checked against promo_code_redemptions
 * so a single customer can never redeem the same code twice, regardless
 * of the code's own global usage_limit.
 */
export async function validatePromoCodeServerSide(
  supabase: SupabaseClient,
  code: string,
  items: CartItemForPromo[],
  customerEmail: string
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

  const normalizedEmail = customerEmail.trim().toLowerCase();
  if (!normalizedEmail) return { valid: false, error: "Enter your email first." };

  const { data: alreadyRedeemed } = await supabase
    .from("promo_code_redemptions")
    .select("id")
    .eq("promo_code_id", promo.id)
    .eq("customer_email", normalizedEmail)
    .maybeSingle();

  if (alreadyRedeemed) {
    return { valid: false, error: "You've already used this code." };
  }

  const cartProductIds = [...new Set(items.map((i) => i.productId))];
  const { data: matchingTiers } = await supabase
    .from("product_discount_tiers")
    .select("product_id")
    .eq("discount_type", promo.discount_type)
    .eq("discount_value", promo.discount_value)
    .in("product_id", cartProductIds);

  const eligibleProductIds = new Set((matchingTiers ?? []).map((t) => t.product_id));
  const eligibleItems = items.filter((i) => eligibleProductIds.has(i.productId));

  if (eligibleItems.length === 0) {
    return {
      valid: false,
      error: "This code doesn't apply to any items in your cart.",
    };
  }

  const eligibleSubtotal = eligibleItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountedEligible = applyDiscount(
    eligibleSubtotal,
    promo.discount_type,
    Number(promo.discount_value)
  );
  const discountAmount = eligibleSubtotal - discountedEligible;

  return { valid: true, promoCodeId: promo.id, discountAmount };
}
