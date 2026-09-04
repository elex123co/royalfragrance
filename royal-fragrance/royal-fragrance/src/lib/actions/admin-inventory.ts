"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

export interface TransferInput {
  vendorId: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  notes?: string;
}

/**
 * Moves stock from central inventory to a vendor. Records the movement
 * with before/after quantities rather than silently overwriting (spec
 * section 23) and never lets the resulting quantity go negative.
 */
export async function transferInventoryToVendor(input: TransferInput) {
  if (input.quantity <= 0) {
    return { success: false, error: "Quantity must be greater than zero" };
  }

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("vendor_inventory")
    .select("id, available_quantity")
    .eq("vendor_id", input.vendorId)
    .eq("product_id", input.productId)
    .eq("variant_id", input.variantId ?? null)
    .maybeSingle();

  const previousQuantity = existing?.available_quantity ?? 0;
  const newQuantity = previousQuantity + input.quantity;

  if (existing) {
    await supabase
      .from("vendor_inventory")
      .update({ available_quantity: newQuantity, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await supabase.from("vendor_inventory").insert({
      vendor_id: input.vendorId,
      product_id: input.productId,
      variant_id: input.variantId ?? null,
      available_quantity: newQuantity,
    });
  }

  const { error } = await supabase.from("inventory_movements").insert({
    vendor_id: input.vendorId,
    product_id: input.productId,
    variant_id: input.variantId ?? null,
    movement_type: "stock_assigned",
    quantity: input.quantity,
    previous_quantity: previousQuantity,
    new_quantity: newQuantity,
    notes: input.notes ?? null,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/vendors");
  revalidatePath("/vendor/inventory");
  return { success: true };
}
