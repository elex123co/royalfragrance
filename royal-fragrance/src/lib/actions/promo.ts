"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { validatePromoCodeServerSide } from "@/lib/utils/promo-validation";

export async function applyPromoCode(code: string, subtotal: number) {
  const supabase = createAdminClient();
  return validatePromoCodeServerSide(supabase, code, subtotal);
}
