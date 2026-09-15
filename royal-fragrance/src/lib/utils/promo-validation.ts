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
 * A code with linked products (promo_code_products) only discounts the
 * matching items in the cart — never the whole order — so a customer
 * can never get an unrelated product discounted by a code that wasn't
 * meant for it. A code with no linked products applies storewide, same
 * as before this restriction existed.
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

  const { data: linkedProducts } = await supabase
    .from("promo_code_products")
    .select("product_id")
    .eq("promo_code_id", promo.id);

  const linkedIds = (linkedProducts ?? []).map((p) => p.product_id);

  // No linked products at all = storewide code, same behavior as before
  // this feature existed. Otherwise, only matching items count.
  const eligibleItems =
    linkedIds.length === 0 ? items : items.filter((i) => linkedIds.includes(i.productId));

  if (linkedIds.length > 0 && eligibleItems.length === 0) {
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
