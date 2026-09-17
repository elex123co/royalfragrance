import { createAdminClient } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/lib/payments";
import { confirmOrderPaidAndDeductStock } from "@/lib/orders/confirm-payment";
import { formatNaira } from "@/lib/utils/currency";
import { LinkButton } from "@/components/ui/Button";
import { PurchaseTracker } from "@/components/analytics/PurchaseTracker";
import { CheckCircle2, Clock, MessageCircle, Users } from "lucide-react";

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
        await confirmOrderPaidAndDeductStock(supabase, order.id);
        paymentStatus = "paid";
      }
    } catch {
      // Leave as pending — the webhook will reconcile this shortly.
    }
  }

  const isPaid = paymentStatus === "paid";

  const { data: whatsapp } = isPaid
    ? await supabase.from("whatsapp_settings").select("*").eq("id", 1).maybeSingle()
    : { data: null };

  return (
    <section className="bg-cream py-16">
      {isPaid && (
        <PurchaseTracker
          orderNumber={order.order_number}
          value={Number(order.total)}
          contentIds={(order.order_items ?? []).map((i: any) => i.product_id)}
        />
      )}
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

          {isPaid && (whatsapp?.business_phone || whatsapp?.group_link) && (
            <div className="mt-6 rounded-xl border border-caramel/30 bg-caramel/10 p-5 text-left">
              <p className="font-display text-base text-espresso">
                Stay in touch on WhatsApp
              </p>
              <p className="mt-1 text-sm text-rich/70">
                Get updates on your order, new arrivals, and exclusive offers.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                {whatsapp?.business_phone && (
                  <a
                    href={`https://wa.me/${whatsapp.business_phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-espresso px-4 py-2.5 text-sm text-cream hover:bg-rich"
                  >
                    <MessageCircle size={16} /> Chat With Us
                  </a>
                )}
                {whatsapp?.group_link && (
                  <a
                    href={whatsapp.group_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-2 rounded-full border border-espresso/20 px-4 py-2.5 text-sm text-espresso hover:bg-espresso/5"
                  >
                    <Users size={16} /> Join Our Group
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="mt-8">
            <LinkButton href="/shop">Continue Shopping</LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
