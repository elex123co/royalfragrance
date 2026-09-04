import { getCurrentVendor, getVendorDashboardData } from "@/lib/data/vendor";
import { formatNaira } from "@/lib/utils/currency";
import { RecordSaleButton } from "@/components/vendor/RecordSaleButton";

export const metadata = { title: "Transactions — Vendor — Royal Fragrance" };

export default async function VendorTransactionsPage() {
  const vendor = await getCurrentVendor();
  const { transactions, unrecordedTransactions, inventory } =
    await getVendorDashboardData(vendor!.user_id);

  const recordedIds = new Set(
    transactions
      .filter((t: any) => !unrecordedTransactions.some((u: any) => u.id === t.id))
      .map((t: any) => t.id)
  );

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-espresso">Transactions</h1>

      {unrecordedTransactions.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-caramel">
            Unrecorded Collections
          </h2>
          <div className="space-y-3">
            {unrecordedTransactions.map((t: any) => (
              <div
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl2 border border-caramel/30 bg-caramel/5 p-4"
              >
                <div>
                  <p className="font-display text-lg text-espresso">
                    + {formatNaira(t.amount)}
                  </p>
                  <p className="text-xs text-rich/50">
                    {new Date(t.transaction_date).toLocaleString()} · Awaiting
                    Sale Record
                  </p>
                </div>
                <RecordSaleButton transactionId={t.id} inventory={inventory} />
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-rich/50">
        All Collections
      </h2>
      <div className="space-y-2">
        {transactions.length === 0 && (
          <p className="text-sm text-rich/50">No collections yet.</p>
        )}
        {transactions.map((t: any) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-xl border border-espresso/10 bg-white/50 px-4 py-3 text-sm"
          >
            <span className="font-display text-espresso">
              {formatNaira(t.amount)}
            </span>
            <span className="text-rich/50">
              {new Date(t.transaction_date).toLocaleDateString()}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs ${
                recordedIds.has(t.id)
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {recordedIds.has(t.id) ? "Sale Recorded" : "Unrecorded"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
