"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { toggleWishlist } from "@/lib/actions/customer";

export function RemoveWishlistButton({ productId }: { productId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => { toggleWishlist(productId); })}
      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-espresso/80 text-cream backdrop-blur-sm transition hover:bg-espresso"
      aria-label="Remove from wishlist"
    >
      <X size={14} />
    </button>
  );
}
