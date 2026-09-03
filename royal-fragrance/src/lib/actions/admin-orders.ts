"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

const VALID_STATUSES = [
  "order_received",
  "payment_confirmed",
  "processing",
  "ready_for_delivery",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export async function updateOrderStatus(
  orderId: string,
  status: (typeof VALID_STATUSES)[number]
) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("orders")
    .update({ order_status: status })
    .eq("id", orderId);

  if (error) return { success: false, error: error.message };

  await supabase.from("audit_logs").insert({
    action: "order.status_changed",
    entity_type: "order",
    entity_id: orderId,
    metadata: { newStatus: status },
  });

  revalidatePath("/admin/orders");
  return { success: true };
}
