import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { getVendorDashboardData } from "@/lib/data/vendor";
import { formatNaira } from "@/lib/utils/currency";
import { InventoryTransferForm } from "@/components/admin/InventoryTransferForm";
import { AmbassadorLevelForm } from "@/components/admin/AmbassadorLevelForm";

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
    .select("*, users!user_id(name, email, phone)")
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
        {vendor.vendor_type && (
          <>
            {" · "}
            <span className="capitalize">{vendor.vendor_type}</span>
          </>
        )}
      </p>

      <div className="mb-6 rounded-xl2 border border-espresso/10 bg-white/60 p-6">
        <h2 className="mb-3 font-display text-lg text-espresso">Applicant Profile</h2>
        <div className="grid gap-2 text-sm text-rich/80 sm:grid-cols-2">
          <p>
            <span className="text-rich/50">Student:</span>{" "}
            {vendor.is_student ? `Yes — ${vendor.university || "university not given"}` : "No"}
          </p>
          <p>
            <span className="text-rich/50">Primary platform:</span>{" "}
            {vendor.primary_platform || "—"}
          </p>
          <p>
            <span className="text-rich/50">Audience size:</span>{" "}
            {vendor.audience_size || "—"}
          </p>
          <p>
            <span className="text-rich/50">Committed to promote:</span>{" "}
            {vendor.promotion_commitment ? "Yes" : "No"}
          </p>
        </div>
        {vendor.onboarding_notes && (
          <p className="mt-3 text-sm text-rich/70">
            <span className="text-rich/50">Notes:</span> {vendor.onboarding_notes}
          </p>
        )}

        <div className="mt-4 border-t border-espresso/10 pt-4">
          <label className="mb-1.5 block text-sm font-medium text-espresso">
            Ambassador Level
          </label>
          <AmbassadorLevelForm vendorId={params.id} initialLevel={vendor.ambassador_level} />
        </div>
      </div>

      {vendor.vendor_type === "affiliate" && (
        <div className="mb-6 rounded-xl2 border border-caramel/30 bg-caramel/10 p-5 text-sm text-espresso">
          This is an affiliate vendor — they don't handle physical inventory,
          so there's nothing to assign below. Their sales come through
          referral links and are tracked automatically.
        </div>
      )}

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
