"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "./require-admin";

const VALID_STATUSES = [
  "order_received",
  "payment_confirmed",
  "processing",
  "ready_for_delivery",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

const STATUS_LABELS: Record<string, string> = {
  order_received: "received",
  payment_confirmed: "payment confirmed",
  processing: "being processed",
  ready_for_delivery: "ready for delivery",
  out_for_delivery: "out for delivery",
  delivered: "delivered",
  cancelled: "cancelled",
};

export async function updateOrderStatus(
  orderId: string,
  status: (typeof VALID_STATUSES)[number]
) {
  const { admin: supabase } = await requireAdmin();

  const { data: order, error } = await supabase
    .from("orders")
    .update({ order_status: status })
    .eq("id", orderId)
    .select("customer_id, order_number")
    .single();

  if (error) return { success: false, error: error.message };

  await supabase.from("audit_logs").insert({
    action: "order.status_changed",
    entity_type: "order",
    entity_id: orderId,
    metadata: { newStatus: status },
  });

  if (order?.customer_id) {
    await supabase.from("notifications").insert({
      user_id: order.customer_id,
      message: `Your order ${order.order_number} is now ${STATUS_LABELS[status] ?? status}.`,
      link: `/order-confirmation?order=${order.order_number}`,
    });
  }

  revalidatePath("/admin/orders");
  return { success: true };
}
