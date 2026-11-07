"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { settleOrderBalance } from "@/lib/actions/batches";
import { useT } from "@/lib/content/client";

export function SettleBalanceButton({ orderId }: { orderId: string }) { const _t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await settleOrderBalance(orderId);
        router.refresh();
      }}
      className="mt-2 rounded-full bg-espresso px-4 py-1.5 text-xs text-cream hover:bg-rich disabled:opacity-40"
    >
      {busy ? _t("batches.settlebalancebutton.56a228", "Saving…") : _t("batches.settlebalancebutton.8ad1d6", "Mark balance as paid")}
    </button>
  );
}
