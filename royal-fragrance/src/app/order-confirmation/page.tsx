import { createAdminClient } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/lib/payments";
import { formatNaira } from "@/lib/utils/currency";
import { LinkButton } from "@/components/ui/Button";
import { CheckCircle2, Clock } from "lucide-react";

export const metadata = { title: "Order Confirmation — Royal Fragrance" };

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  const orderNumber = searchParams.order;

  if (!orderNumber) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-32 text-center lg:px-8">
        <h1 className="font-display text-3xl text-espresso">Order Not Found</h1>
        <p className="mt-3 text-rich/70">
          No order reference was provided.
        </p>
        <div className="mt-8">
          <LinkButton href="/shop">Continue Shopping</LinkButton>
        </div>
      </section>
    );
  }

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*, products(name))")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (!order) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-32 text-center lg:px-8">
        <h1 className="font-display text-3xl text-espresso">Order Not Found</h1>
        <p className="mt-3 text-rich/70">
          We couldn&rsquo;t find an order with reference{" "}
          <span className="font-medium">{orderNumber}</span>.
        </p>
        <div className="mt-8">
          <LinkButton href="/shop">Continue Shopping</LinkButton>
        </div>
      </section>
    );
  }

  // If the webhook hasn't landed yet, do a live server-side verification
  // as a fallback so the customer isn't stuck on "pending" unnecessarily.
  let paymentStatus = order.payment_status;
  if (paymentStatus === "pending") {
    try {
      const provider = getPaymentProvider();
      const verification = await provider.verifyPayment(orderNumber);
      if (verification.status === "success") {
        await supabase
          .from("orders")
          .update({ payment_status: "paid", order_status: "payment_confirmed" })
          .eq("id", order.id);
        paymentStatus = "paid";
      }
    } catch {
      // Leave as pending — the webhook will reconcile this shortly.
    }
  }

  const isPaid = paymentStatus === "paid";

  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-2xl px-5 lg:px-8">
        <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-8 text-center shadow-premium-sm">
          {isPaid ? (
            <CheckCircle2 className="mx-auto text-caramel" size={48} />
          ) : (
            <Clock className="mx-auto text-caramel" size={48} />
          )}

          <h1 className="mt-4 font-display text-2xl text-espresso">
            {isPaid ? "Order Confirmed" : "Payment Pending"}
          </h1>
          <p className="mt-2 text-sm text-rich/70">
            Order <span className="font-medium">{order.order_number}</span>
          </p>

          <div className="mt-8 space-y-2 rounded-xl border border-espresso/10 bg-cream/60 p-5 text-left text-sm">
            {order.order_items?.map((item: any) => (
              <div key={item.id} className="flex justify-between text-rich/80">
                <span>
                  {item.products?.name ?? "Product"} × {item.quantity}
                </span>
                <span>{formatNaira(item.unit_price * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-espresso/10 pt-2 text-rich/80">
              <span>Delivery Fee</span>
              <span>{formatNaira(order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between border-t border-espresso/10 pt-2 font-display text-espresso">
              <span>Total Paid</span>
              <span>{formatNaira(order.total)}</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 text-left text-sm">
            <div>
              <p className="text-rich/50">Delivery Address</p>
              <p className="text-espresso">
                {order.delivery_address}, {order.delivery_city},{" "}
                {order.delivery_state}
              </p>
            </div>
            <div>
              <p className="text-rich/50">Order Status</p>
              <p className="capitalize text-espresso">
                {order.order_status.replaceAll("_", " ")}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <LinkButton href="/shop">Continue Shopping</LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
