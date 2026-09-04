import { getCurrentVendor, getVendorDashboardData } from "@/lib/data/vendor";

export const metadata = { title: "Inventory — Vendor — Royal Fragrance" };

export default async function VendorInventoryPage() {
  const vendor = await getCurrentVendor();
  const { inventory } = await getVendorDashboardData(vendor!.user_id);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-espresso">My Inventory</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {inventory.length === 0 && (
          <p className="text-sm text-rich/50">
            No inventory has been assigned to you yet.
          </p>
        )}
        {inventory.map((item: any) => (
          <div
            key={item.id}
            className="rounded-xl2 border border-espresso/10 bg-white/60 p-5"
          >
            <p className="font-display text-espresso">
              {item.products?.name}
              {item.product_variants?.size ? ` (${item.product_variants.size})` : ""}
            </p>
            <p
              className={`mt-2 font-display text-2xl ${
                item.available_quantity <= 3 ? "text-red-600" : "text-espresso"
              }`}
            >
              {item.available_quantity}
            </p>
            <p className="text-xs text-rich/50">Available</p>
            {item.available_quantity <= 3 && (
              <p className="mt-2 text-xs text-red-600">Low stock — request more</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
