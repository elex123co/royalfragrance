import { BrandImage } from "@/components/ui/BrandImage";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCollection } from "@/lib/data/account";
import { getT } from "@/lib/content/server";

export async function generateMetadata() {
  const _t = await getT();
  return { title: _t("meta.account.collection.title", "My Collection — Royal Fragrance") 
  };
}

export default async function CollectionPage() { const _t = await getT();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/account");

  const collection = await getCollection(user!.id);

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl text-espresso">{_t("account.collection.e08e18", "My Fragrance Collection")}</h1>
      <p className="mb-6 text-sm text-rich/60">
        {collection.length === 0
          ? _t("account.collection.9397ed", "Every fragrance you have purchased will show up here.")
          : `You have purchased ${collection.length} fragrance${collection.length !== 1 ? "s" : ""}.`}
      </p>

      {collection.length === 0 ? (
        <p className="text-sm text-rich/50">
          <Link href="/shop" className="text-caramel underline">{_t("account.collection.cb0301", "Shop the collection")}</Link>{" "}{_t("account.collection.6d4989", "to start building yours.")}</p>
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
              <p className="text-xs text-rich/50">{_t("account.collection.760ef1", "Purchased {v}{v2}", { v: new Date(item.purchasedAt).toLocaleDateString(), v2: item.timesPurchased > 1 ? ` · ${item.timesPurchased}×` : "" })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
