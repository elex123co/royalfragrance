import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/vendors", label: "Vendors", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-7xl gap-8 px-5 py-10 lg:px-8">
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-24 rounded-xl2 border border-espresso/10 bg-white/60 p-4">
          <p className="mb-4 px-2 text-xs uppercase tracking-widest text-caramel">
            Admin
          </p>
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
