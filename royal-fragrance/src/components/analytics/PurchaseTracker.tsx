"use client";

import { useEffect } from "react";
import { trackMetaEvent } from "./MetaPixel";

export function PurchaseTracker({
  orderNumber,
  value,
  contentIds,
}: {
  orderNumber: string;
  value: number;
  contentIds: string[];
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Deduplicated with localStorage (not sessionStorage) — a customer
    // reopening their confirmation link later, e.g. from an email receipt,
    // is a new browser session but the same order, and shouldn't count as
    // a second purchase.
    const key = `rf-purchase-tracked-${orderNumber}`;
    if (localStorage.getItem(key)) return;

    trackMetaEvent("Purchase", {
      value,
      currency: "NGN",
      content_ids: contentIds,
      content_type: "product",
    });
    localStorage.setItem(key, "1");
  }, [orderNumber, value, contentIds]);

  return null;
}
