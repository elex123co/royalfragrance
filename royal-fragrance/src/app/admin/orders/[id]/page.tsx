import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/utils/currency";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order Detail — Admin — Royal Fragrance" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*, products(name, slug, product_images(url, position)))")
    .eq("id", params.id)
    .maybeSingle();

  if (!order) notFound();

  const items = (order.order_items ?? []).sort((a: any, b: any) =>
    a.id.localeCompare(b.id)
  );

  return (
    <div>
      <Link
        href="/admin/orders"
        className="mb-4 flex items-center gap-1.5 text-sm text-rich/60 hover:text-espresso"
      >
        <ArrowLeft size={14} /> Back to Orders
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-espresso">{order.order_number}</h1>
          <p className="text-sm text-rich/50">
            Placed {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
        <OrderStatusSelect orderId={order.id} status={order.order_status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-5">
            <h2 className="mb-3 font-display text-base text-espresso">Items</h2>
            <div className="space-y-3">
              {items.length === 0 && (
                <p className="text-sm text-rich/50">No items found on this order.</p>
              )}
              {items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-espresso/5 pb-3 text-sm last:border-0 last:pb-0"
                >
                  <div>
                    <Link
                      href={`/admin/products/${item.product_id}`}
                      className="font-medium text-espresso hover:underline"
                    >
                      {item.products?.name ?? "Product (deleted)"}
                    </Link>
                    <p className="text-xs text-rich/50">
                      Qty {item.quantity} × {formatNaira(item.unit_price)}
                    </p>
                  </div>
                  <p className="text-espresso">
                    {formatNaira(item.quantity * item.unit_price)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-1.5 border-t border-espresso/10 pt-3 text-sm">
              <div className="flex justify-between text-rich/70">
                <span>Subtotal</span>
                <span>{formatNaira(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-rich/70">
                <span>Delivery Fee</span>
                <span>{formatNaira(order.delivery_fee)}</span>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>
                    Discount{order.new_user_discount_applied ? " (new customer)" : ""}
                  </span>
                  <span>−{formatNaira(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-espresso/10 pt-1.5 font-display text-espresso">
                <span>Total</span>
                <span>{formatNaira(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-5 text-sm">
            <h2 className="mb-3 font-display text-base text-espresso">Customer</h2>
            <p className="text-espresso">{order.customer_name}</p>
            <p className="text-rich/60">{order.customer_email}</p>
            <p className="text-rich/60">{order.customer_phone}</p>
          </div>

          <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-5 text-sm">
            <h2 className="mb-3 font-display text-base text-espresso">Delivery</h2>
            <p className="text-espresso">{order.delivery_address}</p>
            <p className="text-rich/60">
              {order.delivery_city}, {order.delivery_state}
            </p>
          </div>

          <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-5 text-sm">
            <h2 className="mb-3 font-display text-base text-espresso">Payment</h2>
            <p className="text-rich/60">
              Provider: <span className="capitalize text-espresso">{order.payment_provider}</span>
            </p>
            <p className="text-rich/60">
              Status:{" "}
              <span
                className={`capitalize ${
                  order.payment_status === "paid" ? "text-green-700" : "text-amber-700"
                }`}
              >
                {order.payment_status}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
