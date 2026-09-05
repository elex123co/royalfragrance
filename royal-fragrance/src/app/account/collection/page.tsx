import { BrandImage } from "@/components/ui/BrandImage";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCollection } from "@/lib/data/account";

export const metadata = { title: "My Collection — Royal Fragrance" };

export default async function CollectionPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/account");

  const collection = await getCollection(user!.id);

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl text-espresso">
        My Fragrance Collection
      </h1>
      <p className="mb-6 text-sm text-rich/60">
        {collection.length === 0
          ? "Every fragrance you own will show up here."
          : `You own ${collection.length} fragrance${collection.length !== 1 ? "s" : ""}.`}
      </p>

      {collection.length === 0 ? (
        <p className="text-sm text-rich/50">
          <Link href="/shop" className="text-caramel underline">
            Shop the collection
          </Link>{" "}
          to start building yours.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {collection.map((item) => (
            <Link
              key={item.productId}
              href={`/product/${item.slug}`}
              className="group rounded-xl2 border border-espresso/10 bg-white/60 p-3"
            >
              <div className="relative aspect-square overflow-hidden rounded-xl bg-brand-100">
                <BrandImage
                  src={item.image}
                  alt={item.name}
                  className="object-cover transition group-hover:scale-105"
                />
              </div>
              <p className="mt-2 font-display text-sm text-espresso">
                {item.name}
              </p>
              <p className="text-xs text-rich/50">
                Purchased {new Date(item.purchasedAt).toLocaleDateString()}
                {item.timesPurchased > 1 ? ` · ${item.timesPurchased}×` : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
