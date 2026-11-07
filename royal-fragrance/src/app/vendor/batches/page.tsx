import { getCurrentVendor } from "@/lib/data/vendor";
import { getBatchLocations, getBatchesList, getBatchMembers } from "@/lib/data/batches";
import { CreateBatchForm } from "@/components/batches/CreateBatchForm";
import { BatchList } from "@/components/batches/BatchList";
import { getT } from "@/lib/content/server";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const _t = await getT();
  return { title: _t("meta.vendor.batches.title", "Batch Delivery — Vendor — Royal Fragrance") 
  };
}

export default async function VendorBatchesPage() { const _t = await getT();
  const t = await getT();
  const vendor = await getCurrentVendor();
  const [allLocations, batches] = await Promise.all([
    getBatchLocations(true),
    getBatchesList(vendor!.user_id),
  ]);
  const locations = allLocations.filter((l) => l.id === vendor!.batch_location_id);
  const members = await getBatchMembers(batches.map((b) => b.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 font-display text-2xl text-espresso">{t("vendor.batch.title")}</h1>
        <p className="text-sm text-rich/60">
          {t("vendor.batch.text")}
        </p>
      </div>
      {locations.length === 0 ? (
        <p className="rounded-xl2 border border-espresso/10 bg-white/60 p-5 text-sm text-rich/70">
          {t("vendor.batch.nolocation")}
        </p>
      ) : (
        <>
          <p className="text-sm text-rich/70">{_t("vendor.batches.9cf8c0", "Your location:")}{" "}<strong>{locations[0].name}</strong>{_t("vendor.batches.5678c5", ". Customers who order through your link can join your batches.")}</p>
          <CreateBatchForm locations={locations} />
        </>
      )}
      <div>
        <h2 className="mb-3 font-display text-lg text-espresso">{_t("vendor.batches.d92da1", "Your batches")}</h2>
        <BatchList batches={batches} members={members as any} vendorCode={vendor!.vendor_code} />
      </div>
    </div>
  );
}
