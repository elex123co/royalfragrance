import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/utils/currency";
import { VendorRowActions } from "@/components/admin/VendorRowActions";

// Always fetch live data — admin dashboards must never serve a stale build-time snapshot.
export const dynamic = "force-dynamic";

export const metadata = { title: "Vendors — Admin — Royal Fragrance" };

export default async function AdminVendorsPage() {
  const supabase = createAdminClient();

  const { data: vendors, error: vendorsError } = await supabase
    .from("vendors")
    .select(
      "user_id, business_name, status, vendor_code, vendor_type, ambassador_level, is_student, university, primary_platform, audience_size, users!user_id(name, email), vendor_collection_accounts(account_number)"
    )
    .order("created_at", { ascending: false });

  if (vendorsError) {
    console.error("Failed to load vendors:", vendorsError);
  }

  // Aggregate collections + sales + inventory per vendor in a couple of
  // queries rather than N+1 round trips.
  const { data: transactions } = await supabase
    .from("payment_transactions")
    .select("vendor_id, amount")
    .not("vendor_id", "is", null)
    .neq("status", "failed");

  const { data: sales } = await supabase
    .from("vendor_sales")
    .select("vendor_id, vendor_sale_items(quantity, recorded_price)");

  const { data: inventory } = await supabase
    .from("vendor_inventory")
    .select("vendor_id, available_quantity, products(base_price), product_variants(price)");

  // Everything ever assigned to vendors, valued at today's shop prices.
  const { data: assignedMovements } = await supabase
    .from("inventory_movements")
    .select("vendor_id, quantity, products(base_price), product_variants(price)")
    .eq("movement_type", "stock_assigned");

  const unitPrice = (row: any) =>
    Number(row.product_variants?.price ?? row.products?.base_price ?? 0);

  const { data: handovers } = await supabase
    .from("product_handovers")
    .select("vendor_id")
    .is("handover_date", null);

  const { data: commissions } = await supabase
    .from("vendor_commissions")
    .select("vendor_id, amount");

  function sumFor(vendorId: string) {
    const collections = (transactions ?? [])
      .filter((t) => t.vendor_id === vendorId)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const salesCount = (sales ?? []).filter((s) => s.vendor_id === vendorId).length;
    const inventoryLeft = (inventory ?? [])
      .filter((i) => i.vendor_id === vendorId)
      .reduce((sum, i) => sum + i.available_quantity, 0);
    const pendingHandovers = (handovers ?? []).filter(
      (h) => h.vendor_id === vendorId
    ).length;
    const earnings = (commissions ?? [])
      .filter((c) => c.vendor_id === vendorId)
      .reduce((sum, c) => sum + Number(c.amount), 0);
    const stockValue = (inventory ?? [])
      .filter((i: any) => i.vendor_id === vendorId)
      .reduce((sum, i: any) => sum + i.available_quantity * unitPrice(i), 0);
    const salesValue = (sales ?? [])
      .filter((s: any) => s.vendor_id === vendorId)
      .reduce(
        (sum, s: any) =>
          sum +
          (s.vendor_sale_items ?? []).reduce(
            (t: number, it: any) => t + Number(it.quantity) * Number(it.recorded_price),
            0
          ),
        0
      );
    return { collections, salesCount, inventoryLeft, pendingHandovers, earnings, stockValue, salesValue };
  }

  const totals = {
    stockWithVendors: (inventory ?? []).reduce(
      (sum, i: any) => sum + i.available_quantity * unitPrice(i),
      0
    ),
    assignedAllTime: (assignedMovements ?? []).reduce(
      (sum, m: any) => sum + Number(m.quantity) * unitPrice(m),
      0
    ),
    salesMade: (sales ?? []).reduce(
      (sum, s: any) =>
        sum +
        (s.vendor_sale_items ?? []).reduce(
          (t: number, it: any) => t + Number(it.quantity) * Number(it.recorded_price),
          0
        ),
      0
    ),
    collections: (transactions ?? []).reduce((sum, t) => sum + Number(t.amount), 0),
    commissions: (commissions ?? []).reduce((sum, c) => sum + Number(c.amount), 0),
  };

  const summaryCards = [
    { label: "Stock with vendors now", value: totals.stockWithVendors, note: "Value of goods vendors still hold" },
    { label: "Total assigned to vendors", value: totals.assignedAllTime, note: "All stock ever given out, at shop prices" },
    { label: "Sales vendors have made", value: totals.salesMade, note: "Recorded sales, at the prices they sold" },
    { label: "Collections received", value: totals.collections, note: "Paid into vendor collection accounts" },
    { label: "Commissions earned", value: totals.commissions, note: "Vendor and ambassador earnings" },
  ];

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-espresso">Vendors</h1>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {summaryCards.map((c) => (
          <div key={c.label} className="rounded-xl2 border border-espresso/10 bg-white/60 p-4">
            <p className="text-xs uppercase tracking-wide text-rich/50">{c.label}</p>
            <p className="mt-2 font-display text-xl text-espresso">{formatNaira(c.value)}</p>
            <p className="mt-1 text-xs text-rich/50">{c.note}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl2 border border-espresso/10 bg-white/60">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead>
            <tr className="border-b border-espresso/10 text-xs uppercase tracking-wide text-rich/50">
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Profile</th>
              <th className="px-4 py-3">Collection Account</th>
              <th className="px-4 py-3">Total Collections</th>
              <th className="px-4 py-3">Sales</th>
              <th className="px-4 py-3">Earnings</th>
              <th className="px-4 py-3">Inventory</th>
              <th className="px-4 py-3">Stock Value</th>
              <th className="px-4 py-3">Sales Value</th>
              <th className="px-4 py-3">Goods to Deliver</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(!vendors || vendors.length === 0) && (
              <tr>
                <td colSpan={13} className="px-4 py-8 text-center text-rich/50">
                  No vendor applications yet.
                </td>
              </tr>
            )}
            {vendors?.map((v: any) => {
              const stats = sumFor(v.user_id);
              return (
                <tr key={v.user_id} className="border-b border-espresso/5 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/vendors/${v.user_id}`}
                      className="font-medium text-espresso underline-offset-2 hover:underline"
                    >
                      {v.business_name}
                    </Link>
                    <p className="text-xs text-rich/40">
                      {v.users?.email} · {v.vendor_code}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {v.vendor_type ? (
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs capitalize ${
                          v.vendor_type === "physical"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {v.vendor_type}
                      </span>
                    ) : (
                      <span className="text-xs text-rich/40">—</span>
                    )}
                    {v.ambassador_level && (
                      <p className="mt-1 text-xs text-caramel">Level: {v.ambassador_level}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs capitalize ${
                        v.status === "active"
                          ? "bg-green-100 text-green-700"
                          : v.status === "pending_approval"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {v.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-rich/60">
                    {v.is_student && <p>🎓 {v.university || "Student"}</p>}
                    {v.primary_platform && <p>{v.primary_platform}</p>}
                    {v.audience_size && <p>{v.audience_size} reach</p>}
                  </td>
                  <td className="px-4 py-3 text-rich/70">
                    {v.vendor_collection_accounts?.[0]?.account_number ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-rich/70">
                    {formatNaira(stats.collections)}
                  </td>
                  <td className="px-4 py-3 text-rich/70">{stats.salesCount}</td>
                  <td className="px-4 py-3 text-rich/70">{formatNaira(stats.earnings)}</td>
                  <td className="px-4 py-3 text-rich/70">{stats.inventoryLeft}</td>
                  <td className="px-4 py-3 text-rich/70">{formatNaira(stats.stockValue)}</td>
                  <td className="px-4 py-3 text-rich/70">{formatNaira(stats.salesValue)}</td>
                  <td className="px-4 py-3 text-rich/70">{stats.pendingHandovers}</td>
                  <td className="px-4 py-3">
                    <VendorRowActions
                      vendorId={v.user_id}
                      vendorName={(v as any).users?.name ?? ""}
                      status={v.status}
                      vendorType={v.vendor_type}
                      hasCollectionAccount={
                        !!v.vendor_collection_accounts?.[0]?.account_number
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
