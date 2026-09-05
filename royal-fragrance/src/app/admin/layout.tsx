import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/account/LogoutButton";
import { DashboardMobileNav } from "@/components/shared/DashboardMobileNav";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/vendors", label: "Vendors", icon: Users },
];

// A rendered icon element can cross the server→client prop boundary; a
// bare component reference (used below for the desktop sidebar, which
// renders inline in this same Server Component) cannot.
const mobileNavItems = navItems.map((item) => ({
  ...item,
  icon: <item.icon size={20} />,
}));

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already restricts /admin/* to admins — this is just for the
  // greeting, so a failed lookup falls back gracefully rather than blocking.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let firstName = "Admin";
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("name")
      .eq("id", user.id)
      .single();
    if (profile?.name) firstName = profile.name.split(" ")[0];
  }

  return (
    <div className="bg-cream">
      <div className="mx-auto flex min-h-[80vh] max-w-7xl gap-8 px-5 py-10 lg:px-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-xl2 bg-brand-gradient p-5 text-cream shadow-premium">
            <span className="text-xs uppercase tracking-widest text-sand">
              Control Center
            </span>
            <p className="mb-6 mt-1 font-display text-lg">
              Welcome, {firstName}
            </p>

            <nav className="space-y-1">
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
              Control Center
            </span>
            <p className="mt-1 font-display text-xl">Welcome, {firstName}</p>
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
