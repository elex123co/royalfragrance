import { getCurrentVendor, getVendorDashboardData } from "@/lib/data/vendor";
import { formatNaira } from "@/lib/utils/currency";
import { RecordSaleButton } from "@/components/vendor/RecordSaleButton";
import { TransactionsList } from "@/components/vendor/TransactionsList";
import { getT } from "@/lib/content/server";

export async function generateMetadata() {
  const _t = await getT();
  return { title: _t("meta.vendor.transactions.title", "Transactions — Vendor — Royal Fragrance") 
  };
}

export default async function VendorTransactionsPage() { const _t = await getT();
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
      <h1 className="mb-6 font-display text-2xl text-espresso">{_t("vendor.transactions.1e3281", "Transactions")}</h1>

      {unrecordedTransactions.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-caramel">{_t("vendor.transactions.10f456", "Unrecorded Payments")}</h2>
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
                  {t.payer_name && (
                    <p className="text-sm text-espresso">{_t("vendor.transactions.4a4997", "From: {payer_name}", { payer_name: t.payer_name })}</p>
                  )}
                  <p className="text-xs text-rich/50">
                    {new Date(t.transaction_date).toLocaleString()} ·{" "}
                    {t.recorded_total > 0
                      ? `${formatNaira(t.recorded_total)} matched, ${formatNaira(t.remaining)} still to match`
                      : _t("vendor.transactions.7318af", "Awaiting Sale Record")}
                  </p>
                </div>
                <RecordSaleButton
                  transactionId={t.id}
                  inventory={inventory}
                  paymentAmount={Number(t.amount)}
                  remaining={t.remaining}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-rich/50">{_t("vendor.transactions.ba6058", "All Payments")}</h2>
      <p className="mb-3 text-xs text-rich/50">{_t("vendor.transactions.954ff2", "Tap any collection to view its receipt.")}</p>
      <TransactionsList transactions={transactions} recordedIds={recordedIds} />
    </div>
  );
}
