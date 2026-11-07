"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { toggleWishlist } from "@/lib/actions/customer";
import { useT } from "@/lib/content/client";

export function RemoveWishlistButton({ productId }: { productId: string }) { const _t = useT();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => { toggleWishlist(productId); })}
      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-espresso/80 text-cream backdrop-blur-sm transition hover:bg-espresso"
      aria-label={_t("account.removewishlistbutton.fe96c8", "Remove from wishlist")}
    >
      <X size={14} />
    </button>
  );
}
