import { getDeliveryZones } from "@/lib/data/delivery";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata = { title: "Checkout — Royal Fragrance" };

export default async function CheckoutPage() {
  const zones = await getDeliveryZones();

  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <h1 className="mb-10 font-display text-3xl text-espresso">Checkout</h1>
        <CheckoutForm zones={zones} />
      </div>
    </section>
  );
}
