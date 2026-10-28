import { getBatchLocations, getBatchesList, getBatchMembers } from "@/lib/data/batches";
import { BatchLocationsPanel } from "@/components/batches/BatchLocationsPanel";
import { CreateBatchForm } from "@/components/batches/CreateBatchForm";
import { BatchList } from "@/components/batches/BatchList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Batch Delivery — Admin — Royal Fragrance" };

export default async function AdminBatchesPage() {
  const [locations, batches] = await Promise.all([getBatchLocations(), getBatchesList()]);
  const members = await getBatchMembers(batches.map((b) => b.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 font-display text-2xl text-espresso">Batch Delivery</h1>
        <p className="text-sm text-rich/60">
          Customers ordering from the same location share one delivery fee. Set the locations and fees, then open
          batches weekly, monthly or on a custom date. Vendors can open batches too.
        </p>
      </div>
      <BatchLocationsPanel locations={locations} />
      <CreateBatchForm locations={locations.filter((l) => l.active)} />
      <div>
        <h2 className="mb-3 font-display text-lg text-espresso">All batches</h2>
        <BatchList batches={batches} members={members as any} showCreator />
      </div>
    </div>
  );
}
