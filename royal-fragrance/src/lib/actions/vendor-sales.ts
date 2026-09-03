"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

async function requireVendor() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const admin = createAdminClient();
  const { data: vendor } = await admin
    .from("vendors")
    .select("user_id, status")
    .eq("user_id", user.id)
    .single();

  if (!vendor) throw new Error("Not a vendor");
  if (vendor.status !== "active") {
    throw new Error("Your vendor account is not yet active");
  }
  return vendor.user_id;
}

function generateSaleNumber() {
  return `SL-${Date.now().toString().slice(-6)}`;
}

export interface RecordSaleInput {
  transactionId: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  items: { productId: string; variantId?: string; quantity: number; price: number }[];
}

/**
 * Connects a confirmed payment transaction to the products actually sold
 * (spec section 21). Deducts vendor inventory at the point the sale is
 * recorded, and never lets stock go negative. Flags amount mismatches for
 * admin review rather than hiding them.
 */
export async function recordVendorSale(input: RecordSaleInput) {
  const vendorId = await requireVendor();
  const supabase = createAdminClient();

  const { data: transaction } = await supabase
    .from("payment_transactions")
    .select("id, amount, vendor_id")
    .eq("id", input.transactionId)
    .single();

  if (!transaction || transaction.vendor_id !== vendorId) {
    return { success: false, error: "Transaction not found" };
  }

  const recordedTotal = input.items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  let saleStatus: "amount_matches" | "partial_recorded" | "value_mismatch" =
    "amount_matches";
  if (recordedTotal < Number(transaction.amount)) saleStatus = "partial_recorded";
  if (recordedTotal > Number(transaction.amount)) saleStatus = "value_mismatch";

  // Verify sufficient inventory BEFORE writing anything, so we never leave
  // a sale recorded against stock we don't actually have.
  for (const item of input.items) {
    const { data: inv } = await supabase
      .from("vendor_inventory")
      .select("available_quantity")
      .eq("vendor_id", vendorId)
      .eq("product_id", item.productId)
      .eq("variant_id", item.variantId ?? null)
      .maybeSingle();

    if (!inv || inv.available_quantity < item.quantity) {
      return {
        success: false,
        error: `Not enough inventory for one of the selected products.`,
      };
    }
  }

  const { data: sale, error: saleError } = await supabase
    .from("vendor_sales")
    .insert({
      sale_number: generateSaleNumber(),
      vendor_id: vendorId,
      transaction_id: input.transactionId,
      customer_name: input.customerName ?? null,
      customer_phone: input.customerPhone ?? null,
      notes: input.notes ?? null,
      sale_status: saleStatus,
      fulfillment_status: "pending_handover",
    })
    .select()
    .single();

  if (saleError || !sale) {
    return { success: false, error: saleError?.message ?? "Could not record sale" };
  }

  await supabase.from("vendor_sale_items").insert(
    input.items.map((i) => ({
      sale_id: sale.id,
      product_id: i.productId,
      variant_id: i.variantId ?? null,
      quantity: i.quantity,
      recorded_price: i.price,
    }))
  );

  // Deduct inventory + record the movement with before/after quantities.
  for (const item of input.items) {
    const { data: inv } = await supabase
      .from("vendor_inventory")
      .select("id, available_quantity")
      .eq("vendor_id", vendorId)
      .eq("product_id", item.productId)
      .eq("variant_id", item.variantId ?? null)
      .single();

    if (!inv) continue;

    const newQty = inv.available_quantity - item.quantity;

    await supabase
      .from("vendor_inventory")
      .update({ available_quantity: newQty, updated_at: new Date().toISOString() })
      .eq("id", inv.id);

    await supabase.from("inventory_movements").insert({
      vendor_id: vendorId,
      product_id: item.productId,
      variant_id: item.variantId ?? null,
      movement_type: "sale_recorded",
      quantity: -item.quantity,
      previous_quantity: inv.available_quantity,
      new_quantity: newQty,
      performed_by: vendorId,
      notes: `Sale ${sale.sale_number}`,
    });
  }

  await supabase.from("audit_logs").insert({
    action: "sale.record",
    entity_type: "vendor_sale",
    entity_id: sale.id,
    metadata: { saleStatus, recordedTotal },
  });

  revalidatePath("/vendor/sales");
  revalidatePath("/vendor/transactions");
  revalidatePath("/vendor/inventory");
  revalidatePath("/vendor");
  return { success: true, saleId: sale.id };
}

export interface RecordHandoverInput {
  saleId: string;
  recipientName: string;
  recipientPhone: string;
  method:
    | "personal_delivery"
    | "customer_pickup"
    | "courier_delivery"
    | "transfer_to_vendor"
    | "transfer_to_location";
  notes?: string;
}

export async function recordHandover(input: RecordHandoverInput) {
  const vendorId = await requireVendor();
  const supabase = createAdminClient();

  const { data: sale } = await supabase
    .from("vendor_sales")
    .select("id, vendor_id")
    .eq("id", input.saleId)
    .single();

  if (!sale || sale.vendor_id !== vendorId) {
    return { success: false, error: "Sale not found" };
  }

  const { error } = await supabase.from("product_handovers").insert({
    sale_id: input.saleId,
    vendor_id: vendorId,
    recipient_name: input.recipientName,
    recipient_phone: input.recipientPhone,
    method: input.method,
    handover_date: new Date().toISOString(),
    notes: input.notes ?? null,
  });

  if (error) return { success: false, error: error.message };

  await supabase
    .from("vendor_sales")
    .update({ fulfillment_status: "handed_over" })
    .eq("id", input.saleId);

  await supabase.from("audit_logs").insert({
    action: "handover.record",
    entity_type: "vendor_sale",
    entity_id: input.saleId,
    metadata: { method: input.method },
  });

  revalidatePath("/vendor/handovers");
  revalidatePath("/vendor/sales");
  revalidatePath("/vendor");
  return { success: true };
}
