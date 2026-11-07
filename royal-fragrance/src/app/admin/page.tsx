import { createAdminClient } from "@/lib/supabase/server";
import { getMonnifyWalletBalance } from "@/lib/payments/monnify";
import { formatNaira } from "@/lib/utils/currency";
import Link from "next/link";
import { getVendorTotals } from "@/lib/data/vendor-totals";

// Always fetch live data — admin dashboards must never serve a stale build-time snapshot.
export const dynamic = "force-dynamic";

export const metadata = { title: "Admin Overview — Royal Fragrance" };

async function getStats() {
  const supabase = createAdminClient();

  const [
    { count: totalOrders },
    { count: totalCustomers },
    { count: totalVendors },
    { count: pendingOrders },
    { count: completedOrders },
    { data: paidOrders },
    { data: lowStock },
    { count: pendingHandovers },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase.from("vendors").select("*", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("payment_status", "pending"),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("order_status", "delivered"),
    supabase.from("orders").select("total").eq("payment_status", "paid"),
    supabase
      .from("product_variants")
      .select("id, size, stock, products(name)")
      .lt("stock", 5),
    supabase
      .from("product_handovers")
      .select("*", { count: "exact", head: true })
      .is("handover_date", null),
    supabase
      .from("orders")
      .select("order_number, customer_name, total, payment_status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const totalRevenue = (paidOrders ?? []).reduce(
    (sum, o) => sum + Number(o.total),
    0
  );

  return {
    totalOrders: totalOrders ?? 0,
    totalCustomers: totalCustomers ?? 0,
    totalVendors: totalVendors ?? 0,
    pendingOrders: pendingOrders ?? 0,
    completedOrders: completedOrders ?? 0,
    totalRevenue,
    lowStock: lowStock ?? [],
    pendingHandovers: pendingHandovers ?? 0,
    recentOrders: recentOrders ?? [],
  };
}

export default async function AdminOverviewPage() {
  const [stats, wallet, vendorMade] = await Promise.all([
    getStats(),
    getMonnifyWalletBalance(),
    getVendorTotals(),
  ]);

  const cards = [
    { label: "Total Revenue", value: formatNaira(stats.totalRevenue) },
    { label: "Total Orders", value: stats.totalOrders },
    { label: "Total Customers", value: stats.totalCustomers },
    { label: "Total Vendors", value: stats.totalVendors },
    { label: "Pending Orders", value: stats.pendingOrders },
    { label: "Completed Orders", value: stats.completedOrders },
    { label: "Goods Awaiting Delivery", value: stats.pendingHandovers },
    { label: "Low Stock Items", value: stats.lowStock.length },
  ];

  return (
    <div>
      <h1 className="mb-8 font-display text-2xl text-espresso">
        Dashboard Overview
      </h1>

      <div className="mb-4 rounded-xl2 border border-caramel/30 bg-caramel/10 p-5">
        <p className="text-xs uppercase tracking-wide text-rich/60">Monnify account balance</p>
        {wallet.ok ? (
          <>
            <p className="mt-2 font-display text-3xl text-espresso">
              {formatNaira(wallet.balance.availableBalance)}
            </p>
            <p className="mt-1 text-xs text-rich/60">
              Available now. Ledger balance {formatNaira(wallet.balance.ledgerBalance)}. Reload the page to refresh.
            </p>
          </>
        ) : wallet.error === "not_configured" ? (
          <p className="mt-2 text-sm text-rich/70">
            Not connected yet. Add your Monnify wallet account number as MONNIFY_WALLET_ACCOUNT_NUMBER in the site
            settings to see the balance here.
          </p>
        ) : (
          <p className="mt-2 text-sm text-red-600">Could not load the balance: {wallet.error}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl2 border border-espresso/10 bg-white/60 p-5"
          >
            <p className="text-xs uppercase tracking-wide text-rich/50">
              {c.label}
            </p>
            <p className="mt-2 font-display text-2xl text-espresso">
              {c.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="mb-3 font-display text-lg text-espresso">What vendors have made</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Sales vendors made", value: vendorMade.totals.salesValue },
            { label: "Collected by vendors", value: vendorMade.totals.collections },
            { label: "Commissions earned", value: vendorMade.totals.commission },
            { label: "Stock still with vendors", value: vendorMade.totals.stockValue },
          ].map((c) => (
            <div key={c.label} className="rounded-xl2 border border-espresso/10 bg-white/60 p-5">
              <p className="text-xs uppercase tracking-wide text-rich/50">{c.label}</p>
              <p className="mt-2 font-display text-2xl text-espresso">{formatNaira(c.value)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl2 border border-espresso/10 bg-white/60">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-espresso/10 text-xs uppercase tracking-wide text-rich/50">
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Sales made</th>
                <th className="px-4 py-3">Collected</th>
                <th className="px-4 py-3">Commission</th>
                <th className="px-4 py-3">Stock held</th>
              </tr>
            </thead>
            <tbody>
              {vendorMade.list.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-rich/50">
                    No vendors yet.
                  </td>
                </tr>
              )}
              {vendorMade.list.map((v) => (
                <tr key={v.vendorId} className="border-b border-espresso/5 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/vendors/${v.vendorId}`}
                      className="font-medium text-espresso underline-offset-2 hover:underline"
                    >
                      {v.name}
                    </Link>
                    <p className="text-xs text-rich/40">{v.code}</p>
                  </td>
                  <td className="px-4 py-3 text-rich/80">{formatNaira(v.salesValue)}</td>
                  <td className="px-4 py-3 text-rich/80">{formatNaira(v.collections)}</td>
                  <td className="px-4 py-3 text-rich/80">{formatNaira(v.commission)}</td>
                  <td className="px-4 py-3 text-rich/80">{formatNaira(v.stockValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-6">
          <h2 className="font-display text-lg text-espresso">Recent Orders</h2>
          <div className="mt-4 space-y-2">
            {stats.recentOrders.length === 0 && (
              <p className="text-sm text-rich/50">No orders yet.</p>
            )}
            {stats.recentOrders.map((o: any) => (
              <div
                key={o.order_number}
                className="flex justify-between text-sm text-rich/80"
              >
                <span>
                  {o.order_number} — {o.customer_name}
                </span>
                <span>{formatNaira(o.total)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-6">
          <h2 className="font-display text-lg text-espresso">Low Stock Products</h2>
          <div className="mt-4 space-y-2">
            {stats.lowStock.length === 0 && (
              <p className="text-sm text-rich/50">Nothing low on stock.</p>
            )}
            {stats.lowStock.map((v: any) => (
              <div key={v.id} className="flex justify-between text-sm text-rich/80">
                <span>
                  {v.products?.name} ({v.size})
                </span>
                <span className="text-red-600">{v.stock} left</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
