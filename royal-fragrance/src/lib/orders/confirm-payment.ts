import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Marks an order paid, deducts stock for each item, and keeps each
 * affected product's status in sync with its remaining total stock —
 * automatically flips to "out_of_stock" when it hits zero, and back to
 * "active" if a later restock (or a return) brings it above zero, unless
 * the product is explicitly in "draft".
 *
 * Idempotent: if the order is already marked paid, this is a no-op, so it's
 * safe to call from both the webhook and the order-confirmation page's
 * fallback verification without double-deducting stock.
 *
 * Called from two places that both need identical behavior:
 *   - /api/webhooks/paystack (the primary, trusted path)
 *   - /order-confirmation (fallback verification if the webhook is late)
 */
export async function confirmOrderPaidAndDeductStock(
  supabase: SupabaseClient,
  orderId: string
): Promise<{ alreadyConfirmed: boolean }> {
  const { data: order } = await supabase
    .from("orders")
    .select("id, payment_status, customer_id, order_number")
    .eq("id", orderId)
    .single();

  if (!order) return { alreadyConfirmed: false };
  if (order.payment_status === "paid") return { alreadyConfirmed: true };

  await supabase
    .from("orders")
    .update({ payment_status: "paid", order_status: "payment_confirmed" })
    .eq("id", orderId);

  const { data: items } = await supabase
    .from("order_items")
    .select("product_id, variant_id, quantity")
    .eq("order_id", orderId);

  const affectedProductIds = new Set<string>();

  for (const item of items ?? []) {
    if (item.variant_id) {
      const { data: variant } = await supabase
        .from("product_variants")
        .select("stock")
        .eq("id", item.variant_id)
        .single();

      if (variant) {
        const newStock = Math.max(0, variant.stock - item.quantity);
        await supabase
          .from("product_variants")
          .update({ stock: newStock })
          .eq("id", item.variant_id);
      }
    }
    affectedProductIds.add(item.product_id);
  }

  // Re-derive each affected product's status from its real remaining stock.
  for (const productId of affectedProductIds) {
    const { data: product } = await supabase
      .from("products")
      .select("status")
      .eq("id", productId)
      .single();

    if (!product || product.status === "draft") continue; // draft is manual-only

    const { data: variants } = await supabase
      .from("product_variants")
      .select("stock")
      .eq("product_id", productId);

    const totalStock = (variants ?? []).reduce((sum, v) => sum + v.stock, 0);
    const newStatus = totalStock > 0 ? "active" : "out_of_stock";

    if (newStatus !== product.status) {
      await supabase
        .from("products")
        .update({ status: newStatus })
        .eq("id", productId);
    }
  }

  if (order.customer_id) {
    await supabase.from("notifications").insert({
      user_id: order.customer_id,
      message: `Your order ${order.order_number} has been confirmed.`,
      link: `/order-confirmation?order=${order.order_number}`,
    });
  }

  await supabase.from("audit_logs").insert({
    action: "order.payment_confirmed",
    entity_type: "order",
    entity_id: orderId,
    metadata: { orderNumber: order.order_number },
  });

  return { alreadyConfirmed: false };
}
