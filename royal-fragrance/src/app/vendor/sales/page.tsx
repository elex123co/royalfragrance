import { getCurrentVendor, getVendorDashboardData } from "@/lib/data/vendor";
import { formatNaira } from "@/lib/utils/currency";
import { CustomerReceiptButton } from "@/components/vendor/CustomerReceiptButton";
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
          // Older records saved before prices were required may hold 0;
          // fall back to the shop price so totals are not shown as zero.
          const unitPrice = (i: any) =>
            Number(i.recorded_price) > 0
              ? Number(i.recorded_price)
              : Number(i.product_variants?.price ?? i.products?.base_price ?? 0);
          const itemsTotal = (sale.vendor_sale_items ?? []).reduce(
            (sum: number, i: any) => sum + unitPrice(i) * i.quantity,
            0
          );
          const total =
            itemsTotal > 0 ? itemsTotal : Number(sale.payment_transactions?.amount ?? 0);
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
                    {formatNaira(unitPrice(item) * item.quantity)}
                  </p>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs capitalize text-rich/50">
                  Delivery: {sale.fulfillment_status === "pending_handover" ? "waiting to be delivered to customer" : sale.fulfillment_status === "handed_over" ? "delivered to customer" : sale.fulfillment_status.replaceAll("_", " ")}
                </span>
                <div className="flex items-center gap-2">
                  <CustomerReceiptButton
                    data={{
                      saleNumber: sale.sale_number,
                      date: sale.created_at,
                      customerName: sale.customer_name,
                      customerPhone: sale.customer_phone,
                      vendorName: vendor!.display_name || vendor!.business_name,
                      vendorCode: vendor!.vendor_code,
                      paymentReference:
                        sale.payment_transactions?.provider_transaction_reference ?? null,
                      amountPaid: sale.payment_transactions
                        ? Number(sale.payment_transactions.amount)
                        : null,
                      items: (sale.vendor_sale_items ?? []).map((i: any) => ({
                        name: i.products?.name ?? "Item",
                        size: i.product_variants?.size ?? null,
                        quantity: i.quantity,
                        price: unitPrice(i),
                      })),
                    }}
                  />
                  {sale.fulfillment_status === "pending_handover" && (
                    <HandoverButton saleId={sale.id} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
