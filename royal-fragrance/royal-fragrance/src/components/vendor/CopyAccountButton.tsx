"use client";

import { useState } from "react";
import { Copy, Share2 } from "lucide-react";

export function CopyAccountButton({
  accountNumber,
  bankName,
  accountName,
}: {
  accountNumber: string;
  bankName: string;
  accountName: string;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShare() {
    const text = `Pay to:\n${bankName}\n${accountNumber}\n${accountName}`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="mt-6 flex gap-3">
      <button
        onClick={handleCopy}
        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-cream/10 px-4 py-2.5 text-sm text-cream backdrop-blur-sm transition hover:bg-cream/20"
      >
        <Copy size={14} /> {copied ? "Copied!" : "Copy Account Number"}
      </button>
      <button
        onClick={handleShare}
        className="flex items-center justify-center gap-2 rounded-full bg-caramel px-4 py-2.5 text-sm text-espresso transition hover:bg-sand"
      >
        <Share2 size={14} /> Share
      </button>
    </div>
  );
}
