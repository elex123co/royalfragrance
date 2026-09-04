import { getCurrentVendor, getVendorDashboardData } from "@/lib/data/vendor";
import { formatNaira } from "@/lib/utils/currency";
import { HandoverButton } from "@/components/vendor/HandoverButton";

export const metadata = { title: "Sales — Vendor — Royal Fragrance" };

const STATUS_STYLE: Record<string, string> = {
  amount_matches: "bg-green-100 text-green-700",
  partial_recorded: "bg-amber-100 text-amber-700",
  value_mismatch: "bg-red-100 text-red-700",
  requires_review: "bg-red-100 text-red-700",
};

export default async function VendorSalesPage() {
  const vendor = await getCurrentVendor();
  const { sales } = await getVendorDashboardData(vendor!.user_id);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-espresso">Sales</h1>

      <div className="space-y-3">
        {sales.length === 0 && (
          <p className="text-sm text-rich/50">No sales recorded yet.</p>
        )}
        {sales.map((sale: any) => {
          const total = (sale.vendor_sale_items ?? []).reduce(
            (sum: number, i: any) => sum + i.recorded_price * i.quantity,
            0
          );
          return (
            <div
              key={sale.id}
              className="rounded-xl2 border border-espresso/10 bg-white/60 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-display text-espresso">{sale.sale_number}</p>
                  <p className="text-xs text-rich/50">
                    {new Date(sale.created_at).toLocaleString()}
                    {sale.customer_name ? ` · ${sale.customer_name}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs capitalize ${STATUS_STYLE[sale.sale_status] ?? ""}`}
                  >
                    {sale.sale_status.replaceAll("_", " ")}
                  </span>
                  <span className="font-display text-espresso">
                    {formatNaira(total)}
                  </span>
                </div>
              </div>

              <div className="mt-2 space-y-1 text-sm text-rich/70">
                {(sale.vendor_sale_items ?? []).map((item: any) => (
                  <p key={item.id}>
                    {item.products?.name} × {item.quantity} —{" "}
                    {formatNaira(item.recorded_price * item.quantity)}
                  </p>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs capitalize text-rich/50">
                  Fulfillment: {sale.fulfillment_status.replaceAll("_", " ")}
                </span>
                {sale.fulfillment_status === "pending_handover" && (
                  <HandoverButton saleId={sale.id} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
