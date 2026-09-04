import { VendorApplicationForm } from "@/components/vendor/VendorApplicationForm";
import { Wallet, PackageCheck, LineChart, Users } from "lucide-react";

export const metadata = { title: "Become a Vendor — Royal Fragrance" };

const perks = [
  {
    icon: Wallet,
    title: "Dedicated Collection Account",
    description:
      "Where supported by our payment provider, receive a personal account for customer payments.",
  },
  {
    icon: LineChart,
    title: "Monitor Payments Live",
    description: "Every confirmed payment appears in your dashboard automatically.",
  },
  {
    icon: PackageCheck,
    title: "Manage Inventory",
    description: "Track products assigned to you and what you have on hand.",
  },
  {
    icon: Users,
    title: "Track Handovers",
    description: "Record when products are delivered to your customers.",
  },
];

export default function BecomeVendorPage() {
  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="mb-14 text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-caramel">
            Sales Partners
          </span>
          <h1 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">
            Become a Royal Fragrance Vendor
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-rich/70">
            Sell Royal Fragrance products through your own network — online,
            on WhatsApp, or in person — with a dashboard built for real sales
            work.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              {perks.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-xl2 border border-espresso/10 bg-white/50 p-5"
                >
                  <Icon className="text-caramel" size={22} />
                  <h3 className="mt-3 font-display text-base text-espresso">
                    {title}
                  </h3>
                  <p className="mt-1 text-sm text-rich/70">{description}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-sm text-rich/60">
              Applications are reviewed by our team. Once approved, your
              status changes from <strong>Pending Approval</strong> to{" "}
              <strong>Active</strong> and full dashboard features unlock.
            </p>
          </div>

          <VendorApplicationForm />
        </div>
      </div>
    </section>
  );
}
