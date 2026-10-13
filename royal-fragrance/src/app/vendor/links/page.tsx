import { getCurrentVendor, getVendorDashboardData } from "@/lib/data/vendor";
import { getAllProducts } from "@/lib/data/products";
import { LinkGenerator } from "@/components/vendor/LinkGenerator";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Link — Vendor — Royal Fragrance" };

export default async function VendorLinkPage() {
  const vendor = await getCurrentVendor();
  const [{ inventory }, allProducts] = await Promise.all([
    getVendorDashboardData(vendor!.user_id),
    getAllProducts(),
  ]);

  // Affiliates can promote every product in the shop; other vendors only
  // the products assigned to them.
  const isAffiliate = vendor!.vendor_type === "affiliate";
  const assignedIds = new Set(
    inventory.filter((i: any) => i.available_quantity > 0).map((i: any) => i.product_id)
  );
  const products = isAffiliate
    ? allProducts
    : allProducts.filter((p) => assignedIds.has(p.id));

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl text-espresso">My Link</h1>
      <p className="mb-6 text-sm text-rich/60">
        {isAffiliate
          ? "This is your one personal link. Share it with customers: it opens the full Royal Fragrance shop, and every purchase made through it is credited to you. You can also copy a link for any single product below."
          : "This is your one personal link. Share it with customers: it opens a shop showing only the products assigned to you, and every purchase made through it is credited to you."}
      </p>

      <LinkGenerator
        vendorCode={vendor!.vendor_code}
        products={products.map((p) => ({ id: p.id, name: p.name, slug: p.slug }))}
        allProducts={isAffiliate}
      />
    </div>
  );
}
