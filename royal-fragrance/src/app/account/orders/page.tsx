import { BrandImage } from "@/components/ui/BrandImage";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrders } from "@/lib/data/account";
import { formatNaira } from "@/lib/utils/currency";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { BuyAgainButton } from "@/components/account/BuyAgainButton";

export const metadata = { title: "My Orders — Royal Fragrance" };

const STATUS_LABELS: Record<string, string> = {
  order_received: "Order Received",
  payment_confirmed: "Payment Confirmed",
  processing: "Processing",
  ready_for_delivery: "Ready for Delivery",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default async function OrdersPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/account");

  const orders = await getOrders(user!.id);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-espresso">My Orders</h1>

      {orders.length === 0 ? (
        <p className="text-sm text-rich/60">You haven&rsquo;t placed any orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div
              key={order.id}
              className="rounded-xl2 border border-espresso/10 bg-white/60 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-display text-espresso">{order.order_number}</p>
                  <p className="text-xs text-rich/50">
                    {new Date(order.created_at).toLocaleDateString()} ·{" "}
                    {formatNaira(order.total)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs ${
                    order.payment_status === "paid"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {order.payment_status}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {(order.order_items ?? []).map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-brand-100">
                      <BrandImage
                        src={item.products?.product_images?.[0]?.url}
                        alt={item.products?.name ?? "Fragrance"}
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="text-espresso">{item.products?.name}</p>
                      <p className="text-xs text-rich/50">Qty {item.quantity}</p>
                    </div>
                    <p className="text-sm text-rich/70">
                      {formatNaira(item.unit_price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {order.order_status !== "cancelled" && (
                <div className="mt-5">
                  <OrderTimeline status={order.order_status} />
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-rich/50">
                  {STATUS_LABELS[order.order_status] ?? order.order_status}
                </span>
                {order.payment_status === "paid" && (
                  <BuyAgainButton
                    items={(order.order_items ?? []).map((item: any) => ({
                      productId: item.product_id,
                      variantId: item.variant_id ?? undefined,
                      slug: item.products?.slug ?? "",
                      name: item.products?.name ?? "Fragrance",
                      image: item.products?.product_images?.[0]?.url ?? "",
                      price: item.unit_price,
                      quantity: item.quantity,
                    }))}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
