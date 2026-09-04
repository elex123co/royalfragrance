"use client";

import { useTransition, useState } from "react";
import {
  setVendorStatus,
  provisionCollectionAccount,
} from "@/lib/actions/admin-vendors";

export function VendorRowActions({
  vendorId,
  status,
  hasCollectionAccount,
}: {
  vendorId: string;
  status: string;
  hasCollectionAccount: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleProvision() {
    setError(null);
    startTransition(async () => {
      const result = await provisionCollectionAccount(vendorId);
      if (!result.success) setError(result.error ?? "Failed");
    });
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex gap-2">
        {status === "pending_approval" && (
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(() => { setVendorStatus(vendorId, "active"); })
            }
            className="rounded-full bg-espresso px-3 py-1 text-xs text-cream hover:bg-rich"
          >
            Approve
          </button>
        )}
        {status === "active" && (
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(() => { setVendorStatus(vendorId, "suspended"); })
            }
            className="rounded-full border border-red-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
          >
            Suspend
          </button>
        )}
        {status === "suspended" && (
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(() => { setVendorStatus(vendorId, "active"); })
            }
            className="rounded-full bg-espresso px-3 py-1 text-xs text-cream hover:bg-rich"
          >
            Reactivate
          </button>
        )}
        {status === "active" && !hasCollectionAccount && (
          <button
            disabled={isPending}
            onClick={handleProvision}
            className="rounded-full border border-caramel px-3 py-1 text-xs text-caramel hover:bg-caramel/10"
          >
            Set Up Account
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
