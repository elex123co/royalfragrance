"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeProductDiscount } from "@/lib/actions/admin-products";

export function RemoveDiscountButton({ productId, label }: { productId: string; label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <span className="mt-1 flex items-center gap-2 text-xs">
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">{label}</span>
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await removeProductDiscount(productId);
            if (!res.success) alert(res.error ?? "Could not turn off the discount.");
            router.refresh();
          })
        }
        className="text-espresso underline disabled:opacity-40"
      >
        {pending ? "Turning off..." : "Turn off"}
      </button>
    </span>
  );
}
