import { getDeliveryZones } from "@/lib/data/delivery";
import { createAdminClient } from "@/lib/supabase/server";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata = { title: "Checkout — Royal Fragrance" };

// Always fetch live data — new-customer discount eligibility must never be
// served from a stale build-time snapshot.
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const supabase = createAdminClient();
  const [zones, { data: newUserDiscount }] = await Promise.all([
    getDeliveryZones(),
    supabase.from("new_user_discount_settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  const newUserDiscountActive =
    !!newUserDiscount?.enabled &&
    (!newUserDiscount.expires_at || new Date(newUserDiscount.expires_at) > new Date());

  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <h1 className="mb-10 font-display text-3xl text-espresso">Checkout</h1>
        <CheckoutForm
          zones={zones}
          newUserDiscountActive={newUserDiscountActive}
          newUserDiscountPercentage={Number(newUserDiscount?.discount_percentage ?? 10)}
        />
      </div>
    </section>
  );
}
