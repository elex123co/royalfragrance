import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { getVendorDashboardData } from "@/lib/data/vendor";
import { formatNaira } from "@/lib/utils/currency";
import { InventoryTransferForm } from "@/components/admin/InventoryTransferForm";

// Always fetch live data — admin dashboards must never serve a stale build-time snapshot.
export const dynamic = "force-dynamic";

export const metadata = { title: "Vendor Detail — Admin — Royal Fragrance" };

export default async function AdminVendorDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createAdminClient();
  const { data: vendor } = await supabase
    .from("vendors")
    .select("*, users(name, email, phone)")
    .eq("user_id", params.id)
    .single();

  if (!vendor) notFound();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, product_variants(id, size)")
    .eq("status", "active");

  const dashboard = await getVendorDashboardData(params.id);
  const totalCollections = dashboard.transactions.reduce(
    (sum, t: any) => sum + Number(t.amount),
    0
  );

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl text-espresso">
        {vendor.business_name}
      </h1>
      <p className="mb-6 text-sm text-rich/60">
        {vendor.users?.email} · {vendor.vendor_code} ·{" "}
        <span className="capitalize">{vendor.status.replaceAll("_", " ")}</span>
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-6">
          <h2 className="mb-4 font-display text-lg text-espresso">
            Assign Inventory
          </h2>
          <InventoryTransferForm vendorId={params.id} products={products ?? []} />
        </div>

        <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-6">
          <h2 className="mb-4 font-display text-lg text-espresso">Summary</h2>
          <div className="space-y-2 text-sm text-rich/80">
            <div className="flex justify-between">
              <span>Total Collections</span>
              <span>{formatNaira(totalCollections)}</span>
            </div>
            <div className="flex justify-between">
              <span>Recorded Sales</span>
              <span>{dashboard.sales.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Unrecorded Collections</span>
              <span>{dashboard.unrecordedTransactions.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Current Inventory</span>
              <span>
                {dashboard.inventory.reduce(
                  (sum, i: any) => sum + i.available_quantity,
                  0
                )}
              </span>
            </div>
          </div>

          <h3 className="mb-2 mt-6 text-sm font-medium text-espresso">
            Current Inventory
          </h3>
          <div className="space-y-1 text-sm text-rich/70">
            {dashboard.inventory.length === 0 && <p>No inventory assigned yet.</p>}
            {dashboard.inventory.map((i: any) => (
              <div key={i.id} className="flex justify-between">
                <span>
                  {i.products?.name} {i.product_variants?.size ? `(${i.product_variants.size})` : ""}
                </span>
                <span>{i.available_quantity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
