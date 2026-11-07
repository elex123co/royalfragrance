import { LinkButton } from "@/components/ui/Button";
import { getT } from "@/lib/content/server";
import { Wallet, PackageCheck, LineChart, Users } from "lucide-react";

const perkIcons = [Wallet, LineChart, PackageCheck, Users];

export async function BecomeVendor() {
  const t = await getT();
  const perks = perkIcons.map((icon, i) => ({ icon, label: t(`home.vendor.perk${i + 1}`) }));
  return (
    <section className="bg-rich py-24 text-cream">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2 lg:px-8">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-sand">
            {t("home.vendor.label")}
          </span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl">
            {t("home.vendor.title")}
          </h2>
          <p className="mt-6 max-w-lg text-cream/75">
            {t("home.vendor.text")}
          </p>
          <div className="mt-10">
            <LinkButton href="/become-a-vendor" variant="secondary" size="lg">
              {t("home.vendor.btn")}
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
