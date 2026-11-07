"use client";

import { useState } from "react";
import { switchToIndividualDelivery } from "@/lib/actions/batches";
import { formatNaira } from "@/lib/utils/currency";
import { useT } from "@/lib/content/client";

export function SwitchToIndividual({
  orderNumber,
  whatsappPhone,
}: {
  orderNumber: string;
  whatsappPhone?: string | null;
}) { const _t = useT();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    const res = await switchToIndividualDelivery(orderNumber, email);
    setBusy(false);
    if (!res.success) return setError(res.error ?? _t("batches.switchtoindividual.ebaebb", "Could not switch."));
    setBalance(res.balance ?? 0);
  }

  if (balance !== null) {
    const text = encodeURIComponent(
      `Hello, I switched order ${orderNumber} to individual delivery.${balance > 0 ? ` I will pay the balance of ${formatNaira(balance)}.` : ""}`
    );
    return (
      <div className="mt-6 rounded-xl border border-green-300 bg-green-50 p-4 text-left text-sm text-green-900">
        <p className="font-medium">{_t("batches.switchtoindividual.5e1d95", "Switched to individual delivery.")}</p>
        {balance > 0 ? (
          <p className="mt-1">{_t("batches.switchtoindividual.be4799", "Your balance is")}{" "}<strong>{formatNaira(balance)}</strong>{" "}{_t("batches.switchtoindividual.75f509", "(the normal delivery fee minus what you already paid). Message us to settle it and we will ship your order on its own.")}</p>
        ) : (
          <p className="mt-1">{_t("batches.switchtoindividual.bc3c16", "No extra payment is needed. We will ship your order on its own.")}</p>
        )}
        {whatsappPhone && (
          <a
            href={`https://wa.me/${whatsappPhone.replace(/\D/g, "")}?text=${text}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block rounded-full bg-espresso px-4 py-2 text-cream hover:bg-rich"
          >{_t("batches.switchtoindividual.a9993c", "Message us on WhatsApp")}</a>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-espresso/10 bg-cream/60 p-4 text-left text-sm">
      <p className="font-medium text-espresso">{_t("batches.switchtoindividual.047649", "Batch taking too long?")}</p>
      <p className="mt-1 text-rich/70">{_t("batches.switchtoindividual.8bd61a", "You can leave the batch and have your order delivered alone. You pay the difference between the normal delivery fee and the share you already paid.")}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={_t("batches.switchtoindividual.0b9899", "Email used for this order")}
          className="flex-1 rounded-lg border border-espresso/15 px-3 py-2 text-sm focus:border-caramel focus:outline-none"
        />
        <button
          onClick={go}
          disabled={busy || !email.trim()}
          className="rounded-full border border-espresso/30 px-4 py-2 text-espresso hover:bg-espresso/5 disabled:opacity-40"
        >
          {busy ? _t("batches.switchtoindividual.ca40b0", "Switching…") : _t("batches.switchtoindividual.1f78d7", "Switch to individual delivery")}
        </button>
      </div>
      {error && <p className="mt-2 text-red-600">{error}</p>}
    </div>
  );
}
