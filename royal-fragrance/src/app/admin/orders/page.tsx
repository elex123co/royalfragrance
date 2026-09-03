import { createAdminClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/utils/currency";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";

export const metadata = { title: "Orders — Admin — Royal Fragrance" };

export default async function AdminOrdersPage() {
  const supabase = createAdminClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-espresso">Orders</h1>

      <div className="overflow-x-auto rounded-xl2 border border-espresso/10 bg-white/60">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-espresso/10 text-xs uppercase tracking-wide text-rich/50">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-rich/50">
                  No orders yet.
                </td>
              </tr>
            )}
            {orders?.map((order) => (
              <tr key={order.id} className="border-b border-espresso/5 last:border-0">
                <td className="px-4 py-3 font-medium text-espresso">
                  {order.order_number}
                </td>
                <td className="px-4 py-3 text-rich/70">
                  <p>{order.customer_name}</p>
                  <p className="text-xs text-rich/40">{order.customer_email}</p>
                </td>
                <td className="px-4 py-3 text-rich/70">
                  {formatNaira(order.total)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      order.payment_status === "paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {order.payment_status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <OrderStatusSelect orderId={order.id} status={order.order_status} />
                </td>
                <td className="px-4 py-3 text-rich/50">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
