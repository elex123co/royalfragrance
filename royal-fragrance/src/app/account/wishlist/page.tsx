import { BrandImage } from "@/components/ui/BrandImage";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getWishlist } from "@/lib/data/account";
import { formatNaira } from "@/lib/utils/currency";
import { RemoveWishlistButton } from "@/components/account/RemoveWishlistButton";

export const metadata = { title: "My Scent Wishlist — Royal Fragrance" };

export default async function WishlistPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const wishlist = await getWishlist(user!.id);

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl text-espresso">
        My Scent Wishlist
      </h1>
      <p className="mb-6 text-sm text-rich/60">
        Fragrances you&rsquo;re thinking about.
      </p>

      {wishlist.length === 0 ? (
        <p className="text-sm text-rich/50">
          Nothing saved yet.{" "}
          <Link href="/shop" className="text-caramel underline">
            Browse fragrances
          </Link>{" "}
          and tap the heart on anything you love.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {wishlist.map((w: any) => {
            const product = w.products;
            const price =
              product?.product_variants?.[0]?.price ?? product?.base_price ?? 0;
            return (
              <div
                key={w.id}
                className="relative rounded-xl2 border border-espresso/10 bg-white/60 p-3"
              >
                <RemoveWishlistButton productId={w.product_id} />
                <Link href={`/product/${product?.slug}`}>
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-brand-100">
                    <BrandImage
                      src={product?.product_images?.[0]?.url}
                      alt={product?.name ?? "Fragrance"}
                      className="object-cover"
                    />
                  </div>
                  <p className="mt-2 font-display text-sm text-espresso">
                    {product?.name}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-rich/60">{formatNaira(price)}</p>
                    {product?.status === "out_of_stock" && (
                      <span className="text-xs text-red-600">Out of Stock</span>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
