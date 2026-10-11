"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "./require-admin";

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

  const { admin: supabase } = await requireAdmin();

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

/**
 * Takes stock back off a vendor — used to undo a mistaken assignment.
 * Removes `quantity` units (or everything when omitted), logs the movement
 * with before/after quantities, and never goes below zero. Past recorded
 * sales are untouched; only the vendor's current stock changes.
 */
export async function removeVendorInventory(input: {
  inventoryId: string;
  quantity?: number;
}) {
  const { admin: supabase } = await requireAdmin();

  const { data: inv } = await supabase
    .from("vendor_inventory")
    .select("id, vendor_id, product_id, variant_id, available_quantity")
    .eq("id", input.inventoryId)
    .maybeSingle();

  if (!inv) return { success: false, error: "Inventory line not found" };

  const removeQty = input.quantity ?? inv.available_quantity;
  if (!Number.isInteger(removeQty) || removeQty <= 0) {
    return { success: false, error: "Enter a quantity greater than zero" };
  }
  if (removeQty > inv.available_quantity) {
    return {
      success: false,
      error: `The vendor only has ${inv.available_quantity} in stock`,
    };
  }

  const newQuantity = inv.available_quantity - removeQty;

  const { error: updateError } = await supabase
    .from("vendor_inventory")
    .update({ available_quantity: newQuantity, updated_at: new Date().toISOString() })
    .eq("id", inv.id);
  if (updateError) return { success: false, error: updateError.message };

  await supabase.from("inventory_movements").insert({
    vendor_id: inv.vendor_id,
    product_id: inv.product_id,
    variant_id: inv.variant_id,
    movement_type: "stock_adjustment",
    quantity: -removeQty,
    previous_quantity: inv.available_quantity,
    new_quantity: newQuantity,
    notes: "Removed by admin (assignment correction)",
  });

  revalidatePath(`/admin/vendors/${inv.vendor_id}`);
  revalidatePath("/vendor/inventory");
  return { success: true };
}
