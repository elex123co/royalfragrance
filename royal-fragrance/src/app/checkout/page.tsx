import { getDeliveryZones } from "@/lib/data/delivery";
import { getPersonalizedNewUserDiscount } from "@/lib/data/new-user-discount";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata = { title: "Checkout — Royal Fragrance" };

// Always fetch live data — new-customer discount eligibility must never be
// served from a stale build-time snapshot.
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [zones, personalizedDiscount] = await Promise.all([
    getDeliveryZones(),
    getPersonalizedNewUserDiscount(),
  ]);

  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <h1 className="mb-10 font-display text-3xl text-espresso">Checkout</h1>
        <CheckoutForm
          zones={zones}
          newUserDiscountEligible={personalizedDiscount.eligible}
          newUserDiscountPercentage={personalizedDiscount.percentage}
        />
      </div>
    </section>
  );
}
