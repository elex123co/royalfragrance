"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

interface ReorderItem {
  productId: string;
  variantId?: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export function BuyAgainButton({ items }: { items: ReorderItem[] }) {
  const { addItem } = useCart();
  const router = useRouter();

  function handleClick() {
    items.forEach((item) => addItem(item));
    router.push("/cart");
  }

  return (
    <button
      onClick={handleClick}
      className="rounded-full border border-espresso/20 px-4 py-1.5 text-xs font-medium text-espresso transition hover:bg-espresso hover:text-cream"
    >
      Buy Again
    </button>
  );
}
