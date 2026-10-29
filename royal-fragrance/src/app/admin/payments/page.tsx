import { createAdminClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/utils/currency";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payments — Admin — Royal Fragrance" };

function when(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-NG", {
    timeZone: "Africa/Lagos",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const admin = createAdminClient();

  let ordersQuery = admin
    .from("orders")
    .select("id, order_number, customer_name, customer_email, customer_phone, total, payment_provider, paid_at, updated_at")
    .eq("payment_status", "paid")
    .order("paid_at", { ascending: false, nullsFirst: false })
    .limit(300);
  if (q) {
    const safe = q.replace(/[%,()]/g, " ");
    ordersQuery = ordersQuery.or(
      `customer_name.ilike.%${safe}%,customer_email.ilike.%${safe}%,customer_phone.ilike.%${safe}%,order_number.ilike.%${safe}%`
    );
  }

  let txQuery = admin
    .from("payment_transactions")
    .select("id, amount, status, payer_name, payer_phone, transaction_date, provider_transaction_reference, vendors:vendor_id(business_name, display_name)")
    .order("transaction_date", { ascending: false })
    .limit(300);
  if (q) {
    const safe = q.replace(/[%,()]/g, " ");
    txQuery = txQuery.or(`payer_name.ilike.%${safe}%,payer_phone.ilike.%${safe}%`);
  }

  const [{ data: orders }, { data: txs }] = await Promise.all([ordersQuery, txQuery]);

  const orderTotal = (orders ?? []).reduce((s, o: any) => s + Number(o.total), 0);
  const txTotal = (txs ?? []).reduce((s, t: any) => s + Number(t.amount), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-1 font-display text-2xl text-espresso">Payments</h1>
        <p className="text-sm text-rich/60">Who paid, how much, and exactly when. Times are Lagos time.</p>
        <form className="mt-4 flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, email, phone or order number"
            className="w-full max-w-sm rounded-lg border border-espresso/15 px-4 py-2 text-sm focus:border-caramel focus:outline-none"
          />
          <button className="rounded-full bg-espresso px-5 py-2 text-sm text-cream hover:bg-rich">Search</button>
          {q && (
            <a href="/admin/payments" className="px-3 py-2 text-sm text-rich/60 hover:underline">
              Clear
            </a>
          )}
        </form>
      </div>

      <section>
        <h2 className="font-display text-lg text-espresso">Shop order payments</h2>
        <p className="mb-3 text-xs text-rich/60">
          {(orders ?? []).length} payments · {formatNaira(orderTotal)}
        </p>
        <div className="overflow-x-auto rounded-xl2 border border-espresso/10 bg-white/60">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-espresso/10 text-xs uppercase tracking-wide text-rich/50">
                <th className="px-4 py-3">Paid on</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(orders ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-rich/50">
                    No payments found.
                  </td>
                </tr>
              )}
              {(orders ?? []).map((o: any) => (
                <tr key={o.id} className="border-b border-espresso/5 last:border-0">
                  <td className="px-4 py-3 text-rich/80">{when(o.paid_at ?? o.updated_at)}</td>
                  <td className="px-4 py-3 text-espresso">{o.customer_name}</td>
                  <td className="px-4 py-3 text-xs text-rich/70">
                    {o.customer_email}
                    <br />
                    {o.customer_phone}
                  </td>
                  <td className="px-4 py-3">
                    <a href={`/admin/orders/${o.id}`} className="text-espresso underline">
                      {o.order_number}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right text-espresso">{formatNaira(Number(o.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg text-espresso">Vendor collection account payments</h2>
        <p className="mb-3 text-xs text-rich/60">
          {(txs ?? []).length} payments · {formatNaira(txTotal)}
        </p>
        <div className="overflow-x-auto rounded-xl2 border border-espresso/10 bg-white/60">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-espresso/10 text-xs uppercase tracking-wide text-rich/50">
                <th className="px-4 py-3">Paid on</th>
                <th className="px-4 py-3">Paid by</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(txs ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-rich/50">
                    No payments found.
                  </td>
                </tr>
              )}
              {(txs ?? []).map((t: any) => {
                const v = Array.isArray(t.vendors) ? t.vendors[0] : t.vendors;
                return (
                  <tr key={t.id} className="border-b border-espresso/5 last:border-0">
                    <td className="px-4 py-3 text-rich/80">{when(t.transaction_date)}</td>
                    <td className="px-4 py-3 text-espresso">
                      {t.payer_name || "Unknown"}
                      {t.payer_phone ? <span className="block text-xs text-rich/60">{t.payer_phone}</span> : null}
                    </td>
                    <td className="px-4 py-3 text-rich/80">{v?.display_name || v?.business_name || "—"}</td>
                    <td className="px-4 py-3 capitalize text-rich/80">{t.status}</td>
                    <td className="px-4 py-3 text-right text-espresso">{formatNaira(Number(t.amount))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
