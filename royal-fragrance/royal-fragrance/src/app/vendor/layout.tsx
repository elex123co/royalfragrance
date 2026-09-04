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

const navItems = [
  { href: "/vendor", label: "Overview", icon: LayoutDashboard },
  { href: "/vendor/collection-account", label: "Collection Account", icon: Wallet },
  { href: "/vendor/transactions", label: "Transactions", icon: Receipt },
  { href: "/vendor/sales", label: "Sales", icon: ClipboardList },
  { href: "/vendor/inventory", label: "Inventory", icon: Package },
  { href: "/vendor/handovers", label: "Handovers", icon: Truck },
];

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const vendor = await getCurrentVendor();
  if (!vendor) redirect("/login?redirect=/vendor");

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-7xl gap-8 px-5 py-10 lg:px-8">
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-24 rounded-xl2 border border-espresso/10 bg-white/60 p-4">
          <p className="mb-1 px-2 text-xs uppercase tracking-widest text-caramel">
            Vendor
          </p>
          <p className="mb-4 px-2 text-sm font-medium text-espresso">
            {vendor.business_name}
          </p>
          {vendor.status !== "active" && (
            <p className="mb-4 rounded-lg bg-amber-50 px-2 py-1.5 text-xs capitalize text-amber-700">
              {vendor.status.replaceAll("_", " ")}
            </p>
          )}
          <nav className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-rich/80 transition hover:bg-espresso/5 hover:text-espresso"
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <nav className="mb-6 flex gap-4 overflow-x-auto lg:hidden">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="whitespace-nowrap rounded-full border border-espresso/15 px-4 py-1.5 text-sm text-espresso"
            >
              {label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}
