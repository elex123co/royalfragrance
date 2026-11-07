import { redirect } from "next/navigation";
import { getCurrentVendor, getVendorDashboardData } from "@/lib/data/vendor";
import { getT } from "@/lib/content/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function generateMetadata() {
  const _t = await getT();
  return { title: _t("meta.vendor.inventory.title", "Inventory — Vendor — Royal Fragrance") 
  };
}

export default async function VendorInventoryPage() { const _t = await getT();
  const vendor = await getCurrentVendor();
  const isAffiliate = vendor!.vendor_type === "affiliate";
  if (isAffiliate) redirect("/vendor/links");
  const { inventory } = await getVendorDashboardData(vendor!.user_id);

  // First picture of each product, so the vendor can recognise the perfume.
  const productIds = Array.from(new Set(inventory.map((i: any) => i.product_id)));
  const imageFor = new Map<string, string>();
  if (productIds.length > 0) {
    const { data: images } = await createAdminClient()
      .from("product_images")
      .select("product_id, url, position")
      .in("product_id", productIds)
      .order("position");
    for (const img of images ?? []) if (!imageFor.has(img.product_id)) imageFor.set(img.product_id, img.url);
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-espresso">
        {isAffiliate ? _t("vendor.inventory.ea6ea5", "My Products") : _t("vendor.inventory.de400c", "My Inventory")}
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {inventory.length === 0 && (
          <p className="text-sm text-rich/50">{_t("vendor.inventory.8cf98f", "No inventory has been assigned to you yet.")}</p>
        )}
        {inventory.map((item: any) => (
          <div
            key={item.id}
            className="rounded-xl2 border border-espresso/10 bg-white/60 p-5"
          >
            <div className="mb-4 aspect-square w-full overflow-hidden rounded-xl bg-espresso/5">
              {imageFor.get(item.product_id) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageFor.get(item.product_id)}
                  alt={item.products?.name ?? ""}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
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
            <p className="text-xs text-rich/50">{_t("vendor.inventory.7c62a1", "Available")}</p>
            {item.available_quantity <= 3 && (
              <p className="mt-2 text-xs text-red-600">{_t("vendor.inventory.1b2ff1", "Low stock — request more")}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
