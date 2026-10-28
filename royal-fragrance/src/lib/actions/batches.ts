"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "./require-admin";

type Result = { success: boolean; error?: string };

function revalidateAll() {
  revalidatePath("/admin/batches");
  revalidatePath("/vendor/batches");
  revalidatePath("/checkout");
}

// ---------- Locations (admin only) ----------

export async function saveBatchLocation(input: {
  id?: string;
  name: string;
  state: string;
  batchFee: number;
  individualFee: number;
  active: boolean;
}): Promise<Result> {
  const { admin } = await requireAdmin();
  const name = input.name.trim();
  if (!name) return { success: false, error: "Enter a location name." };
  if (!(input.batchFee >= 0) || !(input.individualFee >= 0)) {
    return { success: false, error: "Fees must be zero or more." };
  }
  const row = {
    name,
    state: input.state.trim() || "Lagos",
    batch_fee: input.batchFee,
    individual_fee: input.individualFee,
    active: input.active,
  };
  const { error } = input.id
    ? await admin.from("batch_locations").update(row).eq("id", input.id)
    : await admin.from("batch_locations").insert(row);
  if (error) return { success: false, error: error.message };
  revalidateAll();
  return { success: true };
}

export async function deleteBatchLocation(id: string): Promise<Result> {
  const { admin } = await requireAdmin();
  const { error } = await admin.from("batch_locations").delete().eq("id", id);
  if (error) {
    return {
      success: false,
      error: "This location already has batches. Switch it off instead of deleting.",
    };
  }
  revalidateAll();
  return { success: true };
}

// ---------- Batches (admin or active vendor) ----------

async function requireBatchCreator() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const admin = createAdminClient();
  const { data: profile } = await admin.from("users").select("role").eq("id", user.id).single();
  if (profile?.role === "admin") return { userId: user.id, role: "admin" as const, admin };
  const { data: vendor } = await admin
    .from("vendors")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (vendor?.status !== "active") throw new Error("Not authorized");
  return { userId: user.id, role: "vendor" as const, admin };
}

export async function createBatch(input: {
  locationId: string;
  cycle: "weekly" | "monthly" | "custom";
  customDate?: string;
  maxMembers: number;
  label?: string;
}): Promise<Result> {
  let ctx;
  try {
    ctx = await requireBatchCreator();
  } catch (e: any) {
    return { success: false, error: e.message };
  }

  const max = Math.floor(Number(input.maxMembers));
  if (!(max >= 1) || max > 500) return { success: false, error: "Members must be between 1 and 500." };

  const { data: location } = await ctx.admin
    .from("batch_locations")
    .select("id, active")
    .eq("id", input.locationId)
    .maybeSingle();
  if (!location || !location.active) return { success: false, error: "Pick an active location." };

  const now = new Date();
  let closes: Date;
  if (input.cycle === "weekly") {
    closes = new Date(now.getTime() + 7 * 86400000);
  } else if (input.cycle === "monthly") {
    closes = new Date(now);
    closes.setMonth(closes.getMonth() + 1);
  } else {
    if (!input.customDate) return { success: false, error: "Pick the closing date." };
    closes = new Date(`${input.customDate}T23:59:59`);
    if (Number.isNaN(closes.getTime()) || closes <= now) {
      return { success: false, error: "The closing date must be in the future." };
    }
  }

  const { error } = await ctx.admin.from("delivery_batches").insert({
    location_id: input.locationId,
    created_by: ctx.userId,
    created_by_role: ctx.role,
    cycle: input.cycle,
    closes_at: closes.toISOString(),
    max_members: max,
    label: input.label?.trim() || null,
  });
  if (error) return { success: false, error: error.message };
  revalidateAll();
  return { success: true };
}

export async function setBatchStatus(
  batchId: string,
  status: "open" | "closed" | "delivered" | "cancelled"
): Promise<Result> {
  let ctx;
  try {
    ctx = await requireBatchCreator();
  } catch (e: any) {
    return { success: false, error: e.message };
  }
  const { data: batch } = await ctx.admin
    .from("delivery_batches")
    .select("created_by")
    .eq("id", batchId)
    .maybeSingle();
  if (!batch) return { success: false, error: "Batch not found." };
  if (ctx.role !== "admin" && batch.created_by !== ctx.userId) {
    return { success: false, error: "You can only manage batches you created." };
  }
  const { error } = await ctx.admin.from("delivery_batches").update({ status }).eq("id", batchId);
  if (error) return { success: false, error: error.message };
  revalidateAll();
  return { success: true };
}

export async function settleOrderBalance(orderId: string): Promise<Result> {
  const { admin } = await requireAdmin();
  const { error } = await admin.from("orders").update({ balance_settled: true }).eq("id", orderId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}

// ---------- Customer: leave the batch and ship alone ----------

export async function switchToIndividualDelivery(
  orderNumber: string,
  email: string
): Promise<Result & { balance?: number }> {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, customer_email, payment_status, batch_id, batch_fee_share, batch_switched_at, delivery_state")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (!order || order.customer_email.trim().toLowerCase() !== email.trim().toLowerCase()) {
    return { success: false, error: "That email does not match this order." };
  }
  if (!order.batch_id) return { success: false, error: "This order is not in a batch." };
  if (order.batch_switched_at) return { success: false, error: "You already switched to individual delivery." };
  if (order.payment_status !== "paid") return { success: false, error: "Payment has not been confirmed yet." };

  const { data: batch } = await admin
    .from("delivery_batches")
    .select("status, batch_locations(individual_fee)")
    .eq("id", order.batch_id)
    .maybeSingle();
  if (!batch) return { success: false, error: "Batch not found." };
  if (batch.status === "delivered") return { success: false, error: "This batch has already been delivered." };

  const loc: any = Array.isArray(batch.batch_locations) ? batch.batch_locations[0] : batch.batch_locations;
  const balance = Math.max(0, Number(loc?.individual_fee ?? 0) - Number(order.batch_fee_share));

  const { error } = await admin
    .from("orders")
    .update({
      batch_switched_at: new Date().toISOString(),
      balance_due: balance,
      balance_settled: balance === 0,
    })
    .eq("id", order.id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/order-confirmation");
  revalidatePath("/admin/batches");
  revalidatePath("/vendor/batches");
  return { success: true, balance };
}
