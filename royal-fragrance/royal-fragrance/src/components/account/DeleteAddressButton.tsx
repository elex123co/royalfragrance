"use client";

import { useTransition } from "react";
import { deleteAddress } from "@/lib/actions/customer";

export function DeleteAddressButton({ addressId }: { addressId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (confirm("Remove this address?")) {
          startTransition(() => { deleteAddress(addressId); });
        }
      }}
      className="text-xs text-rich/40 hover:text-red-600"
    >
      Remove
    </button>
  );
}
