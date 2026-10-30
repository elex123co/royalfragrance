import { getDeliveryZones } from "@/lib/data/delivery";
import { getPersonalizedNewUserDiscount } from "@/lib/data/new-user-discount";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { getOpenBatches } from "@/lib/data/batches";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata = { title: "Checkout — Royal Fragrance" };

// Always fetch live data — new-customer discount eligibility must never be
// served from a stale build-time snapshot.
export const dynamic = "force-dynamic";

async function getReferringVendorLocation(): Promise<string | null> {
  const code = cookies().get("rf_ref")?.value;
  // Batch delivery is only offered to customers who came through the
  // vendor's "every other product" link.
  if (!code || cookies().get("rf_batch")?.value?.toUpperCase() !== code.toUpperCase()) return null;
  const { data } = await createAdminClient()
    .from("vendors")
    .select("batch_location_id")
    .eq("vendor_code", code)
    .eq("status", "active")
    .maybeSingle();
  return data?.batch_location_id ?? null;
}

export default async function CheckoutPage() {
  const vendorLocationId = await getReferringVendorLocation();
  const [zones, personalizedDiscount, batches] = await Promise.all([
    getDeliveryZones(),
    getPersonalizedNewUserDiscount(),
    getOpenBatches()
      .then((all) => (vendorLocationId ? all.filter((b) => b.location.id === vendorLocationId) : []))
      .catch(() => []),
  ]);

  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <h1 className="mb-10 font-display text-3xl text-espresso">Checkout</h1>
        <CheckoutForm
          zones={zones}
          batches={batches.map((b) => ({
            id: b.id,
            label: b.label,
            locationName: b.location.name,
            state: b.location.state,
            share: b.share,
            closesAt: b.closes_at,
            spotsLeft: b.max_members - b.members,
          }))}
          newUserDiscountEligible={personalizedDiscount.eligible}
          newUserDiscountPercentage={personalizedDiscount.percentage}
        />
      </div>
    </section>
  );
}
