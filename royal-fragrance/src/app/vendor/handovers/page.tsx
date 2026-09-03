import { getCurrentVendor, getVendorDashboardData } from "@/lib/data/vendor";

export const metadata = { title: "Handovers — Vendor — Royal Fragrance" };

export default async function VendorHandoversPage() {
  const vendor = await getCurrentVendor();
  const { handovers, sales } = await getVendorDashboardData(vendor!.user_id);

  const pending = sales.filter(
    (s: any) => s.fulfillment_status === "pending_handover"
  );

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-espresso">Handovers</h1>

      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-caramel">
        Pending ({pending.length})
      </h2>
      <div className="mb-8 space-y-2">
        {pending.length === 0 && (
          <p className="text-sm text-rich/50">Nothing pending handover.</p>
        )}
        {pending.map((s: any) => (
          <div
            key={s.id}
            className="rounded-xl border border-espresso/10 bg-white/50 px-4 py-3 text-sm"
          >
            <p className="font-medium text-espresso">{s.sale_number}</p>
            <p className="text-rich/50">
              {s.customer_name ?? "No customer name recorded"}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-rich/50">
        Completed
      </h2>
      <div className="space-y-2">
        {handovers.length === 0 && (
          <p className="text-sm text-rich/50">No handovers recorded yet.</p>
        )}
        {handovers.map((h: any) => (
          <div
            key={h.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-espresso/10 bg-white/50 px-4 py-3 text-sm"
          >
            <div>
              <p className="font-medium text-espresso">
                {h.vendor_sales?.sale_number}
              </p>
              <p className="text-rich/50">
                To {h.recipient_name} · {h.method.replaceAll("_", " ")}
              </p>
            </div>
            <span className="text-rich/50">
              {h.handover_date
                ? new Date(h.handover_date).toLocaleDateString()
                : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
