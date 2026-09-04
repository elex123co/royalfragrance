"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleWishlist } from "@/lib/actions/customer";

export function WishlistToggle({
  productId,
  initialWishlisted,
  isLoggedIn,
}: {
  productId: string;
  initialWishlisted: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!isLoggedIn) {
      router.push("/login?redirect=/account/wishlist");
      return;
    }
    setWishlisted((prev) => !prev);
    startTransition(() => {
      toggleWishlist(productId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
        wishlisted
          ? "border-caramel bg-caramel text-espresso"
          : "border-espresso/20 text-espresso hover:border-espresso"
      }`}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart size={18} fill={wishlisted ? "currentColor" : "none"} />
    </button>
  );
}
