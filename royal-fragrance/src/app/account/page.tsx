import Link from "next/link";
import { BrandImage } from "@/components/ui/BrandImage";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getOrders,
  getActiveOrder,
  getCollection,
  getWishlist,
  getScentProfile,
  getRecommendations,
  summarizeScentProfile,
} from "@/lib/data/account";
import { formatNaira } from "@/lib/utils/currency";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { LinkButton } from "@/components/ui/Button";
import { Package, Sparkles, Heart } from "lucide-react";
import { getT } from "@/lib/content/server";

export async function generateMetadata() {
  const _t = await getT();
  return { title: _t("meta.account.title", "My Royal Experience — Royal Fragrance") 
  };
}

export default async function AccountOverviewPage() { const _t = await getT();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/account");


  const [orders, collection, wishlist, scentProfile, recommended] =
    await Promise.all([
      getOrders(user!.id),
      getCollection(user!.id),
      getWishlist(user!.id),
      getScentProfile(user!.id),
      getRecommendations(user!.id),
    ]);

  const activeOrder = getActiveOrder(orders);
  const activeOrdersCount = orders.filter((o: any) =>
    ["order_received", "payment_confirmed", "processing", "ready_for_delivery", "out_for_delivery"].includes(
      o.order_status
    )
  ).length;

  const profileSummary = summarizeScentProfile(scentProfile);

  const stats = [
    {
      label: _t("account.c6aeac", "Active Orders"),
      value: activeOrdersCount,
      icon: Package,
      href: "/account/orders",
    },
    {
      label: _t("account.aa78fd", "My Collection"),
      value: collection.length,
      icon: Sparkles,
      href: "/account/collection",
    },
    {
      label: _t("account.6ff331", "Wishlist"),
      value: wishlist.length,
      icon: Heart,
      href: "/account/wishlist",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-xl2 bg-brand-gradient p-8 text-cream shadow-premium">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-caramel/20 blur-[90px]" />
        <p className="font-display text-2xl">
          {activeOrder
            ? _t("account.5ace76", "Your fragrance is on its way 🚚")
            : _t("account.dbb392", "Ready to discover your next signature scent?")}
        </p>
        <p className="mt-2 max-w-md text-sm text-cream/70">
          {profileSummary ??
            _t("account.49137d", "Complete your Scent Profile so we can recommend fragrances you'll actually love.")}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, href }) => {
          const card = (
            <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-5 transition hover:shadow-premium-sm">
              <Icon className="text-caramel" size={22} />
              <p className="mt-3 font-display text-2xl text-espresso">
                {value}
              </p>
              <p className="text-xs text-rich/60">{label}</p>
            </div>
          );
          return href ? (
            <Link key={label} href={href}>
              {card}
            </Link>
          ) : (
            <div key={label}>{card}</div>
          );
        })}
      </div>

      {/* Active order */}
      {activeOrder && (
        <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg text-espresso">{_t("account.3c3292", "Active Order")}</h2>
            <Link
              href="/account/orders"
              className="text-xs text-caramel underline"
            >{_t("account.02c898", "View All Orders")}</Link>
          </div>
          <p className="text-sm text-rich/70">
            {activeOrder.order_number} · {formatNaira(activeOrder.total)}
          </p>
          <div className="mt-6">
            <OrderTimeline status={activeOrder.order_status} />
          </div>
        </div>
      )}

      {/* Collection preview */}
      <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg text-espresso">{_t("account.44c20b", "Your Fragrance Collection")}</h2>
            <p className="text-xs text-rich/50">{_t("account.ef0f44", "You own {length} fragrance{v}", { length: collection.length, v: collection.length !== 1 ? "s" : "" })}
            </p>
          </div>
          <Link
            href="/account/collection"
            className="text-xs text-caramel underline"
          >{_t("account.8d3e56", "View Collection")}</Link>
        </div>

        {collection.length === 0 ? (
          <p className="text-sm text-rich/50">{_t("account.acf7f6", "Your collection starts with your first order.")}{" "}
            <Link href="/shop" className="text-caramel underline">{_t("account.997020", "Shop fragrances")}</Link>
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {collection.slice(0, 6).map((item) => (
              <Link
                key={item.productId}
                href={`/product/${item.slug}`}
                className="group"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl bg-brand-100">
                  <BrandImage
                    src={item.image}
                    alt={item.name}
                    className="object-cover transition group-hover:scale-105"
                  />
                </div>
                <p className="mt-1.5 truncate text-xs text-espresso">
                  {item.name}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recommended for you */}
      <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-6">
        <div className="mb-4">
          <h2 className="font-display text-lg text-espresso">{_t("account.1e386b", "Recommended For You")}</h2>
          <p className="text-xs text-rich/50">
            {profileSummary
              ? _t("account.777a76", "Based on your Scent Profile")
              : _t("account.519f13", "Popular picks to get you started")}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {recommended.map((p) => (
            <Link key={p.id} href={`/product/${p.slug}`} className="group">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-brand-100">
                <BrandImage
                  src={p.image}
                  alt={p.name}
                  className="object-cover transition group-hover:scale-105"
                />
              </div>
              <p className="mt-1.5 truncate text-xs text-espresso">
                {p.name}
              </p>
              <p className="text-xs text-rich/60">{formatNaira(p.price)}</p>
            </Link>
          ))}
        </div>
        {!profileSummary && (
          <div className="mt-4">
            <LinkButton href="/account/scent-profile" size="sm" variant="outline" className="border-espresso/20 text-espresso">{_t("account.d3b554", "Build Your Scent Profile")}</LinkButton>
          </div>
        )}
      </div>

      {/* Wishlist preview */}
      {wishlist.length > 0 && (
        <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg text-espresso">{_t("account.a4ed2b", "Your Scent Wishlist")}</h2>
            <Link
              href="/account/wishlist"
              className="text-xs text-caramel underline"
            >{_t("account.9c2bb0", "View Wishlist")}</Link>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {wishlist.slice(0, 6).map((w: any) => (
              <Link
                key={w.id}
                href={`/product/${w.products?.slug}`}
                className="group"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl bg-brand-100">
                  <BrandImage
                    src={w.products?.product_images?.[0]?.url}
                    alt={w.products?.name ?? _t("account.ebf862", "Fragrance")}
                    className="object-cover transition group-hover:scale-105"
                  />
                </div>
                <p className="mt-1.5 truncate text-xs text-espresso">
                  {w.products?.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
