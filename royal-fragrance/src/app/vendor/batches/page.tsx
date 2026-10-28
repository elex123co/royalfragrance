import { getCurrentVendor } from "@/lib/data/vendor";
import { getBatchLocations, getBatchesList, getBatchMembers } from "@/lib/data/batches";
import { CreateBatchForm } from "@/components/batches/CreateBatchForm";
import { BatchList } from "@/components/batches/BatchList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Batch Delivery — Vendor — Royal Fragrance" };

export default async function VendorBatchesPage() {
  const vendor = await getCurrentVendor();
  const [locations, batches] = await Promise.all([
    getBatchLocations(true),
    getBatchesList(vendor!.user_id),
  ]);
  const members = await getBatchMembers(batches.map((b) => b.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 font-display text-2xl text-espresso">Batch Delivery</h1>
        <p className="text-sm text-rich/60">
          Group customers from the same location so they share one delivery fee. Open a batch, and customers can join
          it at checkout. Mark it delivered when the run is done.
        </p>
      </div>
      <CreateBatchForm locations={locations} />
      <div>
        <h2 className="mb-3 font-display text-lg text-espresso">Your batches</h2>
        <BatchList batches={batches} members={members as any} />
      </div>
    </div>
  );
}
