"use client";

import { useState } from "react";
import { Copy, MessageCircle } from "lucide-react";

interface LinkProduct {
  id: string;
  name: string;
  slug: string;
}

export function LinkGenerator({
  vendorCode,
  products,
  allProducts = false,
}: {
  vendorCode: string;
  products: LinkProduct[];
  allProducts?: boolean;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const siteUrl =
    typeof window !== "undefined" ? window.location.origin : "https://royalfragrancegallery.com";
  const storeLink = `${siteUrl}/store/${vendorCode}`;

  function copy(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const whatsappText = encodeURIComponent(
    `Shop Royal Fragrance perfumes here: ${storeLink}`
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-6">
        <label className="mb-1.5 block text-sm font-medium text-espresso">
          Your personal link
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={storeLink}
            className="flex-1 rounded-lg border border-espresso/15 bg-cream/50 px-4 py-2.5 text-sm text-rich/70"
          />
          <button
            onClick={() => copy("store", storeLink)}
            className="flex items-center justify-center gap-2 rounded-lg bg-espresso px-4 py-2.5 text-sm text-cream hover:bg-rich"
          >
            <Copy size={14} />
            {copied === "store" ? "Copied!" : "Copy"}
          </button>
          <a
            href={`https://wa.me/?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm text-white hover:bg-green-700"
          >
            <MessageCircle size={14} />
            Share
          </a>
        </div>
      </div>

      <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-6">
        <h2 className="font-display text-lg text-espresso">
          {allProducts ? "Link for a single product" : "Products on your link"}
        </h2>
        {products.length === 0 ? (
          <p className="mt-2 text-sm text-rich/60">
            {allProducts
              ? "There are no products in the shop yet."
              : "No products have been assigned to you yet, so your link has nothing to show. Once the team assigns products to you, they appear here and on your link automatically."}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {products.map((p) => {
              const productLink = `${siteUrl}/product/${p.slug}?ref=${vendorCode}`;
              return (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-espresso/10 bg-cream/50 px-4 py-2.5 text-sm"
                >
                  <span className="text-espresso">{p.name}</span>
                  <button
                    onClick={() => copy(p.id, productLink)}
                    className="flex shrink-0 items-center gap-1.5 text-xs text-caramel hover:underline"
                  >
                    <Copy size={12} />
                    {copied === p.id ? "Copied!" : "Copy single-product link"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
