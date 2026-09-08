import { getCurrentVendor } from "@/lib/data/vendor";
import { getAllProducts } from "@/lib/data/products";
import { LinkGenerator } from "@/components/vendor/LinkGenerator";

export const metadata = { title: "My Links — Vendor — Royal Fragrance" };

export default async function VendorLinksPage() {
  const vendor = await getCurrentVendor();
  const products = await getAllProducts();

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl text-espresso">My Links</h1>
      <p className="mb-6 text-sm text-rich/60">
        Share a product link below — anyone who buys through it gets attributed
        to you automatically, and you earn 10% commission once their order is
        confirmed.
      </p>

      <LinkGenerator vendorCode={vendor!.vendor_code} products={products} />
    </div>
  );
}
