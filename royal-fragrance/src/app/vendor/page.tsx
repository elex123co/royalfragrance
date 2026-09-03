import { getCurrentVendor, getVendorDashboardData } from "@/lib/data/vendor";
import { formatNaira } from "@/lib/utils/currency";

export const metadata = { title: "Vendor Overview — Royal Fragrance" };

export default async function VendorOverviewPage() {
  const vendor = await getCurrentVendor();
  const data = await getVendorDashboardData(vendor!.user_id);

  const today = new Date().toDateString();
  const todaysCollections = data.transactions
    .filter((t: any) => new Date(t.transaction_date).toDateString() === today)
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthlyCollections = data.transactions
    .filter((t: any) => new Date(t.transaction_date) >= monthStart)
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  const totalCollections = data.transactions.reduce(
    (sum: number, t: any) => sum + Number(t.amount),
    0
  );

  const pendingHandovers = data.sales.filter(
    (s: any) => s.fulfillment_status === "pending_handover"
  ).length;

  const inventorySummary = data.inventory.reduce(
    (sum: number, i: any) => sum + i.available_quantity,
    0
  );

  const cards = [
    { label: "Total Collections", value: formatNaira(totalCollections) },
    { label: "Today's Collections", value: formatNaira(todaysCollections) },
    { label: "Monthly Collections", value: formatNaira(monthlyCollections) },
    { label: "Pending Sale Records", value: data.unrecordedTransactions.length },
    { label: "Pending Handovers", value: pendingHandovers },
    { label: "Inventory On Hand", value: inventorySummary },
  ];

  return (
    <div>
      <h1 className="mb-8 font-display text-2xl text-espresso">
        Welcome, {vendor?.business_name}
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {data.unrecordedTransactions.length > 0 && (
        <div className="mt-8 rounded-xl2 border border-caramel/30 bg-caramel/10 p-5">
          <p className="text-sm text-espresso">
            You have {data.unrecordedTransactions.length} confirmed payment
            {data.unrecordedTransactions.length > 1 ? "s" : ""} waiting to be
            matched to a sale.{" "}
            <a href="/vendor/transactions" className="underline">
              Record now
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
