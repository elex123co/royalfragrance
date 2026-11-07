"use client";

import { useTransition } from "react";
import { deleteAddress } from "@/lib/actions/customer";
import { useT } from "@/lib/content/client";

export function DeleteAddressButton({ addressId }: { addressId: string }) { const _t = useT();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (confirm(_t("account.deleteaddressbutton.ba8955", "Remove this address?"))) {
          startTransition(() => { deleteAddress(addressId); });
        }
      }}
      className="text-xs text-rich/40 hover:text-red-600"
    >{_t("account.deleteaddressbutton.e96390", "Remove")}</button>
  );
}
