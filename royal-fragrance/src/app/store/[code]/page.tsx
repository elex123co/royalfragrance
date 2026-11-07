import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { getAllProducts } from "@/lib/data/products";
import { getActiveNewUserDiscountPercent } from "@/lib/data/new-user-discount";
import { ProductCard } from "@/components/ui/ProductCard";
import { VendorProductTile } from "@/components/store/VendorProductTile";
import { waLink } from "@/lib/utils/whatsapp";
import { getT } from "@/lib/content/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { code: string } }) {
  const code = decodeURIComponent(params.code).toUpperCase();
  let name: string | null = null;
  try {
    const { data } = await createAdminClient()
      .from("vendors")
      .select("business_name, display_name, status")
      .eq("vendor_code", code)
      .maybeSingle();
    if (data && data.status === "active") name = String(data.display_name || data.business_name).toUpperCase();
  } catch {
    name = null;
  }
  const title = name ? `VEND ${name} | Royal Fragrance` : `Shop Royal Fragrance (${code})`;
  const description = name
    ? `Tap to see ${name}'s perfume catalogue and order from Royal Fragrance.`
    : "Browse the Royal Fragrance products available through your representative.";
  return {
    title,
    description,
    robots: { index: false },
    openGraph: { title, description, type: "website" as const },
    twitter: { card: "summary_large_image" as const, title, description },
  };
}

/**
 * A vendor's single shareable storefront. It lists only the products that
 * were assigned to that vendor, and middleware stores the vendor code in
 * the referral cookie when this page is opened, so any purchase the
 * customer makes afterward is attributed to the vendor automatically.
 */
export default async function VendorStorePage({ params }: { params: { code: string } }) { const _t = await getT();
  const code = decodeURIComponent(params.code).toUpperCase();
  const admin = createAdminClient();

  const { data: vendor } = await admin
    .from("vendors")
    .select(
      "user_id, business_name, display_name, status, vendor_code, vendor_type, batch_location_id, application_answers, users!user_id(phone)"
    )
    .eq("vendor_code", code)
    .maybeSingle();

  if (!vendor || vendor.status !== "active") notFound();

  // Affiliates promote the whole shop, so nothing is assigned to them.
  // Other vendors only show the products assigned to them.
  const isAffiliate = vendor.vendor_type === "affiliate";
  const { data: inventory } = isAffiliate
    ? { data: [] as { product_id: string }[] }
    : await admin
        .from("vendor_inventory")
        .select("product_id, available_quantity")
        .eq("vendor_id", vendor.user_id)
        .gt("available_quantity", 0);

  const assignedIds = new Set((inventory ?? []).map((i) => i.product_id));

  const [allProducts, newUserDiscountPercent] = await Promise.all([
    getAllProducts(),
    getActiveNewUserDiscountPercent(),
  ]);
  const products = isAffiliate
    ? allProducts
    : allProducts.filter((p) => assignedIds.has(p.id));

  const vendorName = vendor.display_name || vendor.business_name;
  const vendorPhone: string | null =
    (Array.isArray((vendor as any).users) ? (vendor as any).users[0]?.phone : (vendor as any).users?.phone) ??
    (vendor as any).application_answers?.phone ??
    null;

  return (
    <section className="bg-cream py-12">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-8 text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-caramel">{_t("store.code.c07431", "Royal Fragrance")}</span>
          <h1 className="mt-2 font-display text-3xl text-espresso">{_t("store.code.ef6929", "VEND {v}", { v: (vendor.display_name || vendor.business_name).toUpperCase() })}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-rich/70">{_t("store.code.595c14", "Choose from the fragrances available through your representative.")}</p>
        </div>

        {!isAffiliate && (
          <div className="mx-auto mb-8 max-w-3xl space-y-3">
            <div className="rounded-xl2 border border-espresso/10 bg-white/70 p-4 text-sm text-rich/80">
              <p className="font-medium text-espresso">{_t("store.code.370127", "How to order")}</p>
              <p className="mt-1">
                <strong>{_t("store.code.c66b70", "Near {vendorName}?", { vendorName })}</strong>{" "}{_t("store.code.cd66ad", "Tap “Chat vendor to buy” and pay them directly on WhatsApp.")}</p>
              <p className="mt-1">
                <strong>{_t("store.code.018c80", "Far away?")}</strong>{" "}{_t("store.code.911836", "Tap “Order online” and check out normally. We deliver to you.")}</p>
            </div>
            <Link
              href={`/store/${encodeURIComponent(code)}/more`}
              className="block rounded-xl2 border border-caramel/40 bg-caramel/10 p-4 text-sm text-espresso hover:bg-caramel/20"
            >
              <span className="font-medium">{_t("store.code.13679f", "Want a perfume {vendorName} does not have?", { vendorName })}</span>
              <span className="mt-0.5 block text-rich/70">{_t("store.code.d7eb30", "Tap here to see every other product on the site. You can order those with shared batch delivery.")}</span>
            </Link>
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center">
            <p className="text-rich/60">{_t("store.code.b2b903", "No products are available here right now.")}</p>
            <Link href="/shop" className="mt-4 inline-block text-caramel underline">{_t("store.code.03c882", "Browse the full shop")}</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-4">
            {products.map((product) =>
              isAffiliate ? (
                <ProductCard
                  key={product.id}
                  product={product}
                  newUserDiscountPercent={newUserDiscountPercent}
                />
              ) : (
                <VendorProductTile
                  key={product.id}
                  product={product}
                  newUserDiscountPercent={newUserDiscountPercent}
                  whatsappHref={waLink(
                    vendorPhone,
                    `Hello ${vendorName}, I saw ${product.name} on your Royal Fragrance link and I would like to buy it. Is it available?`
                  )}
                />
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}
