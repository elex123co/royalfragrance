import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { getAllProducts } from "@/lib/data/products";
import { getActiveNewUserDiscountPercent } from "@/lib/data/new-user-discount";
import { ProductCard } from "@/components/ui/ProductCard";
import { VendorProductTile } from "@/components/store/VendorProductTile";
import { waLink } from "@/lib/utils/whatsapp";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { code: string } }) {
  return {
    title: `Shop Royal Fragrance (${params.code.toUpperCase()})`,
    description: "Browse the Royal Fragrance products available through your representative.",
    robots: { index: false },
  };
}

/**
 * A vendor's single shareable storefront. It lists only the products that
 * were assigned to that vendor, and middleware stores the vendor code in
 * the referral cookie when this page is opened, so any purchase the
 * customer makes afterward is attributed to the vendor automatically.
 */
export default async function VendorStorePage({ params }: { params: { code: string } }) {
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
          <span className="text-xs uppercase tracking-[0.2em] text-caramel">
            Royal Fragrance
          </span>
          <h1 className="mt-2 font-display text-3xl text-espresso">
            VEND {(vendor.display_name || vendor.business_name).toUpperCase()}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-rich/70">
            Choose from the fragrances available through your representative.
          </p>
        </div>

        {!isAffiliate && (
          <div className="mx-auto mb-8 max-w-3xl space-y-3">
            <div className="rounded-xl2 border border-espresso/10 bg-white/70 p-4 text-sm text-rich/80">
              <p className="font-medium text-espresso">How to order</p>
              <p className="mt-1">
                <strong>Near {vendorName}?</strong> Tap &ldquo;Chat vendor to buy&rdquo; and pay them directly on WhatsApp.
              </p>
              <p className="mt-1">
                <strong>Far away?</strong> Tap &ldquo;Order online&rdquo; and check out normally. We deliver to you.
              </p>
            </div>
            <Link
              href={`/store/${encodeURIComponent(code)}/more`}
              className="block rounded-xl2 border border-caramel/40 bg-caramel/10 p-4 text-sm text-espresso hover:bg-caramel/20"
            >
              <span className="font-medium">Want a perfume {vendorName} does not have?</span>
              <span className="mt-0.5 block text-rich/70">
                Tap here to see every other product on the site. You can order those with shared batch delivery.
              </span>
            </Link>
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center">
            <p className="text-rich/60">No products are available here right now.</p>
            <Link href="/shop" className="mt-4 inline-block text-caramel underline">
              Browse the full shop
            </Link>
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
