import { createAdminClient } from "@/lib/supabase/server";
import { DeliveryFeesTable } from "@/components/admin/DeliveryFeesTable";

// Always fetch live data — admin dashboards must never serve a stale build-time snapshot.
export const dynamic = "force-dynamic";

export const metadata = { title: "Delivery Fees — Admin — Royal Fragrance" };

export default async function AdminDeliveryFeesPage() {
  const supabase = createAdminClient();
  const { data: zones } = await supabase
    .from("delivery_zones")
    .select("*")
    .order("name");

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl text-espresso">Delivery Fees</h1>
      <p className="mb-6 text-sm text-rich/60">
        Set the delivery fee for each state. Customers see this fee added to
        their total the moment they pick their state at checkout.
      </p>
      <DeliveryFeesTable zones={zones ?? []} />
    </div>
  );
}
