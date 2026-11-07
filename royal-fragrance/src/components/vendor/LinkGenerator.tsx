"use client";

import { useState } from "react";
import { Copy, MessageCircle, Download, Share2 } from "lucide-react";
import { useT } from "@/lib/content/client";

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
}) { const _t = useT();
  const [copied, setCopied] = useState<string | null>(null);

  const siteUrl =
    typeof window !== "undefined" ? window.location.origin : "https://royalfragrancegallery.com";
  const storeLink = `${siteUrl}/store/${vendorCode}`;

  function copy(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const cardUrl = `/store/${encodeURIComponent(vendorCode)}/opengraph-image`;
  const cardMessage = `Shop Royal Fragrance perfumes with me. Tap here to see my catalogue and order: ${storeLink}`;

  async function shareCard() {
    try {
      const blob = await (await fetch(cardUrl)).blob();
      const file = new File([blob], `royal-fragrance-${vendorCode}.png`, { type: "image/png" });
      const nav: any = navigator;
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], text: cardMessage });
        return;
      }
    } catch {
      // fall through to the plain WhatsApp link below
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(cardMessage)}`, "_blank");
  }

  const whatsappText = encodeURIComponent(
    `Shop Royal Fragrance perfumes here: ${storeLink}`
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-6">
        <p className="mb-1 text-sm font-medium text-espresso">{_t("vendor.linkgenerator.77a566", "Your vendor card")}</p>
        <p className="mb-3 text-xs text-rich/60">{_t("vendor.linkgenerator.cf1772", "Post this card on your WhatsApp status or send it to chats. The caption carries your link, and when you paste your link anywhere, it shows up as this same card that people can tap.")}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cardUrl} alt={_t("vendor.linkgenerator.77a566", "Your vendor card")} className="w-full max-w-xl rounded-xl border border-espresso/10" />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={shareCard}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm text-white hover:bg-green-700"
          >
            <Share2 size={14} />{" "}{_t("vendor.linkgenerator.4d324f", "Share card")}</button>
          <a
            href={cardUrl}
            download={`royal-fragrance-${vendorCode}.png`}
            className="flex items-center gap-2 rounded-lg border border-espresso/20 px-4 py-2.5 text-sm text-espresso hover:bg-espresso/5"
          >
            <Download size={14} />{" "}{_t("vendor.linkgenerator.0f1877", "Download card")}</a>
        </div>
      </div>

      <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-6">
        <label className="mb-1.5 block text-sm font-medium text-espresso">{_t("vendor.linkgenerator.4fc4d0", "Your personal link")}</label>
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
            {copied === "store" ? _t("vendor.linkgenerator.b7c3ca", "Copied!") : _t("vendor.linkgenerator.af74f7", "Copy")}
          </button>
          <a
            href={`https://wa.me/?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm text-white hover:bg-green-700"
          >
            <MessageCircle size={14} />{_t("vendor.linkgenerator.09ca55", "Share")}</a>
        </div>
      </div>

      <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-6">
        <h2 className="font-display text-lg text-espresso">
          {allProducts ? _t("vendor.linkgenerator.88777f", "Link for a single product") : _t("vendor.linkgenerator.191ca2", "Products on your link")}
        </h2>
        {products.length === 0 ? (
          <p className="mt-2 text-sm text-rich/60">
            {allProducts
              ? _t("vendor.linkgenerator.314663", "There are no products in the shop yet.")
              : _t("vendor.linkgenerator.12ab1b", "No products have been assigned to you yet, so your link has nothing to show. Once the team assigns products to you, they appear here and on your link automatically.")}
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
                    {copied === p.id ? _t("vendor.linkgenerator.b7c3ca", "Copied!") : _t("vendor.linkgenerator.83a796", "Copy single-product link")}
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
