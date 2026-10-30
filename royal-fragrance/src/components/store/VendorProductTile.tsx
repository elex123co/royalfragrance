import Link from "next/link";
import { MessageCircle, ShoppingBag } from "lucide-react";
import { ProductCard } from "@/components/ui/ProductCard";
import type { Product } from "@/lib/types/product";

/**
 * A product the vendor has in stock, with two clear ways to buy it:
 * chat the vendor on WhatsApp (for customers near them) or order online
 * through the normal checkout (for customers far away).
 */
export function VendorProductTile({
  product,
  whatsappHref,
  newUserDiscountPercent,
}: {
  product: Product;
  whatsappHref: string | null;
  newUserDiscountPercent?: number | null;
}) {
  return (
    <div className="flex flex-col gap-2">
      <ProductCard product={product} newUserDiscountPercent={newUserDiscountPercent} />
      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-full bg-espresso px-3 py-2 text-xs text-cream hover:bg-rich"
        >
          <MessageCircle size={14} /> Chat vendor to buy
        </a>
      )}
      <Link
        href={`/product/${product.slug}`}
        className="flex items-center justify-center gap-1.5 rounded-full border border-espresso/20 px-3 py-2 text-xs text-espresso hover:bg-espresso/5"
      >
        <ShoppingBag size={14} /> Order online (far away)
      </Link>
    </div>
  );
}
