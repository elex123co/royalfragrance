import { createAdminClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/utils/currency";
import { VendorRowActions } from "@/components/admin/VendorRowActions";

export const metadata = { title: "Vendors — Admin — Royal Fragrance" };

export default async function AdminVendorsPage() {
  const supabase = createAdminClient();

  const { data: vendors } = await supabase
    .from("vendors")
    .select(
      "user_id, business_name, status, vendor_code, users(name, email), vendor_collection_accounts(account_number)"
    )
    .order("created_at", { ascending: false });

  // Aggregate collections + sales + inventory per vendor in a couple of
  // queries rather than N+1 round trips.
  const { data: transactions } = await supabase
    .from("payment_transactions")
    .select("vendor_id, amount")
    .not("vendor_id", "is", null);

  const { data: sales } = await supabase
    .from("vendor_sales")
    .select("vendor_id");

  const { data: inventory } = await supabase
    .from("vendor_inventory")
    .select("vendor_id, available_quantity");

  const { data: handovers } = await supabase
    .from("product_handovers")
    .select("vendor_id")
    .is("handover_date", null);

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
    return { collections, salesCount, inventoryLeft, pendingHandovers };
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-espresso">Vendors</h1>

      <div className="overflow-x-auto rounded-xl2 border border-espresso/10 bg-white/60">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-espresso/10 text-xs uppercase tracking-wide text-rich/50">
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Collection Account</th>
              <th className="px-4 py-3">Total Collections</th>
              <th className="px-4 py-3">Sales</th>
              <th className="px-4 py-3">Inventory</th>
              <th className="px-4 py-3">Pending Handovers</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(!vendors || vendors.length === 0) && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-rich/50">
                  No vendor applications yet.
                </td>
              </tr>
            )}
            {vendors?.map((v: any) => {
              const stats = sumFor(v.user_id);
              return (
                <tr key={v.user_id} className="border-b border-espresso/5 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-espresso">{v.business_name}</p>
                    <p className="text-xs text-rich/40">
                      {v.users?.email} · {v.vendor_code}
                    </p>
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
                  <td className="px-4 py-3 text-rich/70">
                    {v.vendor_collection_accounts?.[0]?.account_number ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-rich/70">
                    {formatNaira(stats.collections)}
                  </td>
                  <td className="px-4 py-3 text-rich/70">{stats.salesCount}</td>
                  <td className="px-4 py-3 text-rich/70">{stats.inventoryLeft}</td>
                  <td className="px-4 py-3 text-rich/70">{stats.pendingHandovers}</td>
                  <td className="px-4 py-3">
                    <VendorRowActions
                      vendorId={v.user_id}
                      status={v.status}
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
