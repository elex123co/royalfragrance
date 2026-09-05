import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  ClipboardList,
  Package,
  Truck,
} from "lucide-react";
import { getCurrentVendor } from "@/lib/data/vendor";
import { LogoutButton } from "@/components/account/LogoutButton";
import { DashboardMobileNav } from "@/components/shared/DashboardMobileNav";

const navItems = [
  { href: "/vendor", label: "Overview", icon: LayoutDashboard },
  { href: "/vendor/collection-account", label: "Collection Account", icon: Wallet },
  { href: "/vendor/transactions", label: "Transactions", icon: Receipt },
  { href: "/vendor/sales", label: "Sales", icon: ClipboardList },
  { href: "/vendor/inventory", label: "Inventory", icon: Package },
  { href: "/vendor/handovers", label: "Handovers", icon: Truck },
];

// A rendered icon element can cross the server→client prop boundary; a
// bare component reference (used below for the desktop sidebar, which
// renders inline in this same Server Component) cannot.
const mobileNavItems = navItems.map((item) => ({
  ...item,
  icon: <item.icon size={20} />,
}));

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/login?redirect=/vendor");

  return (
    <div className="bg-cream">
      <div className="mx-auto flex min-h-[80vh] max-w-7xl gap-8 px-5 py-10 lg:px-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-xl2 bg-brand-gradient p-5 text-cream shadow-premium">
            <span className="text-xs uppercase tracking-widest text-sand">
              Vendor Workspace
            </span>
            <p className="mt-1 font-display text-lg">{vendor.business_name}</p>
            {vendor.status !== "active" && (
              <p className="mb-4 mt-3 rounded-lg bg-caramel/20 px-2 py-1.5 text-xs capitalize text-sand">
                {vendor.status.replaceAll("_", " ")}
              </p>
            )}

            <nav className={vendor.status !== "active" ? "space-y-1" : "mt-6 space-y-1"}>
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-cream/75 transition hover:bg-cream/10 hover:text-cream"
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="mt-4 border-t border-cream/10 pt-4">
              <LogoutButton />
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-20 lg:pb-0">
          <div className="mb-6 rounded-xl2 bg-brand-gradient p-5 text-cream shadow-premium lg:hidden">
            <span className="text-xs uppercase tracking-widest text-sand">
              Vendor Workspace
            </span>
            <p className="mt-1 font-display text-xl">{vendor.business_name}</p>
          </div>

          {children}
        </div>
      </div>

      <DashboardMobileNav
        primaryTabs={mobileNavItems.slice(0, 4)}
        moreLinks={mobileNavItems.slice(4)}
      />
    </div>
  );
}
