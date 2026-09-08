"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import type { Product } from "@/lib/types/product";

export function LinkGenerator({
  vendorCode,
  products,
}: {
  vendorCode: string;
  products: Product[];
}) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [copied, setCopied] = useState(false);

  const selected = products.find((p) => p.id === productId);
  const siteUrl =
    typeof window !== "undefined" ? window.location.origin : "https://royalfragrancegallery.com";
  const link = selected ? `${siteUrl}/product/${selected.slug}?ref=${vendorCode}` : "";

  function copyLink() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-6">
      <label className="mb-1.5 block text-sm font-medium text-espresso">
        Choose a product
      </label>
      <select
        value={productId}
        onChange={(e) => setProductId(e.target.value)}
        className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm"
      >
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {link && (
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-espresso">
            Your link
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={link}
              className="flex-1 rounded-lg border border-espresso/15 bg-cream/50 px-4 py-2.5 text-sm text-rich/70"
            />
            <button
              onClick={copyLink}
              className="flex items-center gap-2 rounded-lg bg-espresso px-4 py-2.5 text-sm text-cream hover:bg-rich"
            >
              <Copy size={14} />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
