export type DiscountType = "percentage" | "fixed_amount" | null;

/**
 * Applies a discount to a price, floored at 0 — a fixed-amount discount
 * larger than the price itself should never produce a negative price.
 */
export function applyDiscount(
  price: number,
  discountType: DiscountType,
  discountValue: number | null | undefined
): number {
  if (!discountType || !discountValue) return price;
  if (discountType === "percentage") {
    return Math.max(0, Math.round(price * (1 - discountValue / 100)));
  }
  return Math.max(0, price - discountValue);
}

export function discountLabel(discountType: DiscountType, discountValue: number | null | undefined): string | null {
  if (!discountType || !discountValue) return null;
  return discountType === "percentage" ? `${discountValue}% OFF` : `₦${discountValue.toLocaleString()} OFF`;
}
