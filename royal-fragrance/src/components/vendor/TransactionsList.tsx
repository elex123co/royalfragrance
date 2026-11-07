"use client";

import { useState } from "react";
import { formatNaira } from "@/lib/utils/currency";
import { TransactionReceiptModal } from "./TransactionReceiptModal";
import { useT } from "@/lib/content/client";

interface Transaction {
  id: string;
  provider: string;
  provider_transaction_reference: string;
  amount: number;
  status: string;
  payer_name: string | null;
  transaction_date: string;
}

export function TransactionsList({
  transactions,
  recordedIds,
}: {
  transactions: Transaction[];
  recordedIds: Set<string>;
}) { const _t = useT();
  const [selected, setSelected] = useState<Transaction | null>(null);

  return (
    <>
      <div className="space-y-2">
        {transactions.length === 0 && (
          <p className="text-sm text-rich/50">{_t("vendor.transactionslist.615f25", "No collections yet.")}</p>
        )}
        {transactions.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelected(t)}
            className="flex w-full flex-col gap-1 rounded-xl border border-espresso/10 bg-white/50 px-4 py-3 text-left text-sm transition hover:border-caramel/40"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-display text-espresso">{formatNaira(t.amount)}</span>
                {t.payer_name && (
                  <p className="text-xs text-rich/60">{_t("vendor.transactionslist.4a4997", "From: {payer_name}", { payer_name: t.payer_name })}</p>
                )}
              </div>
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
                {recordedIds.has(t.id) ? _t("vendor.transactionslist.80712f", "Sale Recorded") : _t("vendor.transactionslist.79af6c", "Unrecorded")}
              </span>
            </div>
            <p className="truncate text-xs text-rich/40">{_t("vendor.transactionslist.98cec1", "Ref: {provider_transaction_reference}", { provider_transaction_reference: t.provider_transaction_reference })}
            </p>
          </button>
        ))}
      </div>

      {selected && (
        <TransactionReceiptModal transaction={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
