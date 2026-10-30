import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { getAllProducts } from "@/lib/data/products";
import { getActiveNewUserDiscountPercent } from "@/lib/data/new-user-discount";
import { ProductCard } from "@/components/ui/ProductCard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "More from Royal Fragrance",
  robots: { index: false },
};

/**
 * Every product the vendor does NOT have in stock. Middleware marks anyone
 * who opens this page, so they can join the vendor's location batch at
 * checkout and share one delivery fee with others.
 */
export default async function VendorMoreProductsPage({ params }: { params: { code: string } }) {
  const code = decodeURIComponent(params.code).toUpperCase();
  const admin = createAdminClient();

  const { data: vendor } = await admin
    .from("vendors")
    .select("user_id, business_name, display_name, status, vendor_type, batch_location_id")
    .eq("vendor_code", code)
    .maybeSingle();

  if (!vendor || vendor.status !== "active") notFound();
  if (vendor.vendor_type === "affiliate") redirect(`/store/${encodeURIComponent(code)}`);

  const vendorName = vendor.display_name || vendor.business_name;

  const [{ data: inventory }, allProducts, newUserDiscountPercent, locationRes] = await Promise.all([
    admin
      .from("vendor_inventory")
      .select("product_id")
      .eq("vendor_id", vendor.user_id)
      .gt("available_quantity", 0),
    getAllProducts(),
    getActiveNewUserDiscountPercent(),
    vendor.batch_location_id
      ? admin.from("batch_locations").select("name").eq("id", vendor.batch_location_id).maybeSingle()
      : Promise.resolve({ data: null as { name: string } | null }),
  ]);

  const have = new Set((inventory ?? []).map((i) => i.product_id));
  const products = allProducts.filter((p) => !have.has(p.id));
  const locationName = locationRes.data?.name ?? null;

  return (
    <section className="bg-cream py-12">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-8 text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-caramel">Royal Fragrance</span>
          <h1 className="mt-2 font-display text-3xl text-espresso">More Perfumes</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-rich/70">
            These are the perfumes {vendorName} does not have in stock.
            {locationName
              ? ` Order them here and share one delivery fee with other customers in ${locationName} by choosing batch delivery at checkout.`
              : " Order them here with normal delivery."}
          </p>
          <Link
            href={`/store/${encodeURIComponent(code)}`}
            className="mt-3 inline-block text-sm text-caramel underline"
          >
            Back to {vendorName}&rsquo;s perfumes
          </Link>
        </div>

        {products.length === 0 ? (
          <p className="text-center text-rich/60">There is nothing else to show right now.</p>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} newUserDiscountPercent={newUserDiscountPercent} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
