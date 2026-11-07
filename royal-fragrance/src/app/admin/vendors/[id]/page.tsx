import { ANSWER_LABELS } from "@/lib/vendor-application-fields";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { getVendorDashboardData } from "@/lib/data/vendor";
import { formatNaira } from "@/lib/utils/currency";
import { InventoryTransferForm } from "@/components/admin/InventoryTransferForm";
import { VendorInventoryRow } from "@/components/admin/VendorInventoryRow";
import { VendorBatchLocationForm } from "@/components/admin/VendorBatchLocationForm";
import { getBatchLocations } from "@/lib/data/batches";
import { AmbassadorLevelForm } from "@/components/admin/AmbassadorLevelForm";

// Always fetch live data — admin dashboards must never serve a stale build-time snapshot.
export const dynamic = "force-dynamic";

export const metadata = { title: "Vendor Detail — Admin — Royal Fragrance" };

const SALE_STATUS: Record<string, { label: string; style: string; hint: string }> = {
  amount_matches: {
    label: "Amount matches",
    style: "bg-green-100 text-green-700",
    hint: "The products recorded add up to the payment received.",
  },
  partial_recorded: {
    label: "Partly recorded",
    style: "bg-amber-100 text-amber-700",
    hint: "The products recorded so far add up to less than the payment received. The vendor still has to add the rest.",
  },
  value_mismatch: {
    label: "Value mismatch",
    style: "bg-red-100 text-red-700",
    hint: "The products recorded add up to more than the payment received.",
  },
  requires_review: {
    label: "Needs review",
    style: "bg-red-100 text-red-700",
    hint: "Flagged for the admin to check.",
  },
};

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

  const batchLocations = await getBatchLocations(true);
  const dashboard = await getVendorDashboardData(params.id);

  // Group any duplicate rows for the same product and size into one line, and
  // work out how much was assigned, sold and is left for each.
  const productIds = Array.from(new Set(dashboard.inventory.map((i: any) => i.product_id)));
  const [{ data: imageRows }, { data: movements }] = await Promise.all([
    productIds.length
      ? supabase
          .from("product_images")
          .select("product_id, url, position")
          .in("product_id", productIds)
          .order("position")
      : Promise.resolve({ data: [] as any[] }),
    supabase
      .from("inventory_movements")
      .select("product_id, variant_id, movement_type, quantity")
      .eq("vendor_id", params.id),
  ]);
  const imageFor = new Map<string, string>();
  for (const r of imageRows ?? []) if (!imageFor.has(r.product_id)) imageFor.set(r.product_id, r.url);

  const lineKey = (p: string, v: string | null) => `${p}:${v ?? ""}`;
  const lineMap = new Map<string, any>();
  for (const i of dashboard.inventory as any[]) {
    const key = lineKey(i.product_id, i.variant_id);
    const cur = lineMap.get(key);
    if (cur) cur.left += i.available_quantity;
    else
      lineMap.set(key, {
        id: i.id,
        key,
        name: i.products?.name ?? "Product",
        size: i.product_variants?.size ?? null,
        image: imageFor.get(i.product_id) ?? null,
        left: i.available_quantity,
        assigned: 0,
        sold: 0,
      });
  }
  for (const m of movements ?? []) {
    const line = lineMap.get(lineKey(m.product_id, m.variant_id));
    if (!line) continue;
    if (m.movement_type === "stock_assigned") line.assigned += Number(m.quantity);
    if (m.movement_type === "sale_recorded") line.sold += Math.abs(Number(m.quantity));
  }
  // Assigned is worked out as sold + left, so the three numbers always agree.
  // (Counting assignment records alone ignored corrections made later.)
  const inventoryLines = Array.from(lineMap.values()).map((l: any) => ({
    ...l,
    assigned: l.left + l.sold,
  }));
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

      <VendorBatchLocationForm
        vendorUserId={vendor.user_id}
        current={vendor.batch_location_id ?? null}
        locations={batchLocations.map((l) => ({ id: l.id, name: l.name }))}
      />

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
          <p>
            <span className="text-rich/50">BVN/NIN on file:</span>{" "}
            {vendor.bvn || vendor.nin ? (
              <span className="text-green-700">
                Yes ({vendor.bvn ? "BVN" : "NIN"} ···{(vendor.bvn || vendor.nin).slice(-4)})
              </span>
            ) : (
              <span className="text-amber-700">
                None — required for a Monnify collection account
              </span>
            )}
          </p>
        </div>
        {vendor.application_answers && (
          <div className="mt-4 border-t border-espresso/10 pt-4">
            <h3 className="mb-2 text-sm font-medium text-espresso">Application answers</h3>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {Object.entries(vendor.application_answers as Record<string, string>)
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-rich/50">{ANSWER_LABELS[k] ?? k}</dt>
                    <dd className="text-rich/80">{v}</dd>
                  </div>
                ))}
            </dl>
          </div>
        )}
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
          This is an affiliate vendor, so there is nothing to assign. They can
          promote every product in the shop through one personal link (which
          opens the full shop) or a link for any single product, and their
          sales through those links are tracked automatically.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {vendor.vendor_type !== "affiliate" && (
          <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-6">
            <h2 className="mb-4 font-display text-lg text-espresso">
              Assign Inventory
            </h2>
            <InventoryTransferForm vendorId={params.id} products={products ?? []} />
          </div>
        )}

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
            {vendor.vendor_type !== "affiliate" && (
            <div className="flex justify-between">
              <span>Current Inventory</span>
              <span>
                {dashboard.inventory.reduce(
                  (sum, i: any) => sum + i.available_quantity,
                  0
                )}
              </span>
            </div>
            )}
          </div>

          {vendor.vendor_type !== "affiliate" && (
          <>
          <h3 className="mb-2 mt-6 text-sm font-medium text-espresso">
            Current Inventory
          </h3>
          <div className="space-y-2 text-sm text-rich/70">
            {inventoryLines.length === 0 && <p>No inventory assigned yet.</p>}
            {inventoryLines.map((l: any) => (
              <VendorInventoryRow
                key={l.key}
                inventoryId={l.id}
                name={l.name}
                size={l.size}
                imageUrl={l.image}
                assigned={l.assigned}
                sold={l.sold}
                left={l.left}
              />
            ))}
          </div>
          </>
          )}
        </div>

        <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-6 lg:col-span-2">
          <h2 className="mb-4 font-display text-lg text-espresso">Recorded Sales</h2>
          <div className="space-y-3">
            {dashboard.sales.length === 0 && (
              <p className="text-sm text-rich/50">No sales recorded yet.</p>
            )}
            {dashboard.sales.map((sale: any) => (
              <div
                key={sale.id}
                className="rounded-xl border border-espresso/10 bg-cream/60 p-4 text-sm"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-espresso">{sale.sale_number}</span>
                  <span className="text-xs text-rich/50">
                    {new Date(sale.created_at).toLocaleString()}
                  </span>
                  <span
                    title={SALE_STATUS[sale.sale_status]?.hint}
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      SALE_STATUS[sale.sale_status]?.style ?? "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {SALE_STATUS[sale.sale_status]?.label ?? sale.sale_status.replace(/_/g, " ")}
                  </span>
                </div>
                {sale.payment_transactions && (
                  <p className="mb-2 text-xs text-rich/60">
                    Payment received: {formatNaira(sale.payment_transactions.amount)}.{" "}
                    {SALE_STATUS[sale.sale_status]?.hint}
                  </p>
                )}
                {(sale.customer_name || sale.customer_phone) && (
                  <p className="mb-2 text-xs text-rich/60">
                    Customer: {sale.customer_name}
                    {sale.customer_phone ? ` · ${sale.customer_phone}` : ""}
                  </p>
                )}
                <div className="space-y-1 border-t border-espresso/10 pt-2">
                  {(sale.vendor_sale_items ?? []).map((item: any) => (
                    <div key={item.id} className="flex justify-between text-xs text-rich/70">
                      <span>
                        {item.products?.name ?? "Product"} × {item.quantity}
                      </span>
                      <span>{formatNaira(item.quantity * item.recorded_price)}</span>
                    </div>
                  ))}
                </div>
                {sale.notes && (
                  <p className="mt-2 text-xs italic text-rich/50">Note: {sale.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
