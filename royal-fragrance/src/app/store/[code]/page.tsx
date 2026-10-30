import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { getAllProducts } from "@/lib/data/products";
import { getActiveNewUserDiscountPercent } from "@/lib/data/new-user-discount";
import { ProductCard } from "@/components/ui/ProductCard";

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
    .select("user_id, business_name, display_name, status, vendor_code, vendor_type")
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

        {products.length === 0 ? (
          <div className="text-center">
            <p className="text-rich/60">No products are available here right now.</p>
            <Link href="/shop" className="mt-4 inline-block text-caramel underline">
              Browse the full shop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                newUserDiscountPercent={newUserDiscountPercent}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
