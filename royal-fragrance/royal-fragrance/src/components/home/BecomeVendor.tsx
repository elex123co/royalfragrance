import { LinkButton } from "@/components/ui/Button";
import { Wallet, PackageCheck, LineChart, Users } from "lucide-react";

const perks = [
  { icon: Wallet, label: "Dedicated collection account" },
  { icon: LineChart, label: "Monitor incoming payments" },
  { icon: PackageCheck, label: "Manage assigned inventory" },
  { icon: Users, label: "Track customer handovers" },
];

export function BecomeVendor() {
  return (
    <section className="bg-rich py-24 text-cream">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2 lg:px-8">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-sand">
            Sales Partners
          </span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">
            Become a Royal Fragrance Vendor
          </h2>
          <p className="mt-6 max-w-lg text-cream/75">
            Qualified vendors and sales partners can sell Royal Fragrance
            products with their own personal dashboard — built to feel like a
            modern financial and sales workspace.
          </p>
          <div className="mt-10">
            <LinkButton href="/become-a-vendor" variant="secondary" size="lg">
              Become a Vendor
            </LinkButton>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {perks.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="glass rounded-xl2 p-6 text-center"
            >
              <Icon className="mx-auto text-caramel" size={26} />
              <p className="mt-3 text-sm text-cream/85">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
