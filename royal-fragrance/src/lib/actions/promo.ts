"use server";

import { createAdminClient } from "@/lib/supabase/server";
import {
  validatePromoCodeServerSide,
  type CartItemForPromo,
} from "@/lib/utils/promo-validation";

export async function applyPromoCode(
  code: string,
  items: CartItemForPromo[],
  customerEmail: string
) {
  const supabase = createAdminClient();
  return validatePromoCodeServerSide(supabase, code, items, customerEmail);
}
