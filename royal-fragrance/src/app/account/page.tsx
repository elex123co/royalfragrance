import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/utils/currency";

export const metadata = { title: "My Account — Royal Fragrance" };

const STATUS_LABELS: Record<string, string> = {
  order_received: "Order Received",
  payment_confirmed: "Payment Confirmed",
  processing: "Processing",
  ready_for_delivery: "Ready for Delivery",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default async function AccountPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/account");

  const { data: profile } = await supabase
    .from("users")
    .select("name, email, phone")
    .eq("id", user.id)
    .single();

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-4xl px-5 lg:px-8">
        <h1 className="mb-8 font-display text-3xl text-espresso">My Account</h1>

        <div className="mb-10 rounded-xl2 border border-espresso/10 bg-white/60 p-6 shadow-premium-sm">
          <h2 className="font-display text-lg text-espresso">Profile</h2>
          <div className="mt-3 grid gap-2 text-sm text-rich/80 sm:grid-cols-3">
            <p>
              <span className="text-rich/50">Name:</span> {profile?.name}
            </p>
            <p>
              <span className="text-rich/50">Email:</span> {profile?.email}
            </p>
            <p>
              <span className="text-rich/50">Phone:</span>{" "}
              {profile?.phone ?? "—"}
            </p>
          </div>
        </div>

        <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-6 shadow-premium-sm">
          <h2 className="font-display text-lg text-espresso">Order History</h2>

          {!orders || orders.length === 0 ? (
            <p className="mt-4 text-sm text-rich/60">
              You haven&rsquo;t placed any orders yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-espresso/10 bg-cream/60 p-4 text-sm"
                >
                  <div>
                    <p className="font-medium text-espresso">
                      {order.order_number}
                    </p>
                    <p className="text-rich/50">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        order.payment_status === "paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {order.payment_status}
                    </span>
                    <span className="text-rich/70">
                      {STATUS_LABELS[order.order_status] ?? order.order_status}
                    </span>
                    <span className="font-display text-espresso">
                      {formatNaira(order.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
