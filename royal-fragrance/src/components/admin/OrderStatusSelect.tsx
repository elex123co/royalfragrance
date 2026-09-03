"use client";

import { useTransition } from "react";
import { updateOrderStatus } from "@/lib/actions/admin-orders";

const STATUSES = [
  "order_received",
  "payment_confirmed",
  "processing",
  "ready_for_delivery",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={isPending}
      onChange={(e) =>
        startTransition(() => {
          updateOrderStatus(orderId, e.target.value as (typeof STATUSES)[number]);
        })
      }
      className="rounded-lg border border-espresso/15 bg-white px-2 py-1 text-xs capitalize"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.replaceAll("_", " ")}
        </option>
      ))}
    </select>
  );
}
