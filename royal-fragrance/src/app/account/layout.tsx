import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Sparkles,
  Heart,
  MapPin,
  Settings,
  Bell,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getNotifications, getProfile } from "@/lib/data/account";
import { LogoutButton } from "@/components/account/LogoutButton";
import { MobileDashboardNav } from "@/components/account/MobileDashboardNav";

const navItems = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/orders", label: "My Orders", icon: Package },
  { href: "/account/collection", label: "My Collection", icon: Sparkles },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/scent-profile", label: "Scent Profile", icon: Sparkles },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
  { href: "/account/settings", label: "Account Settings", icon: Settings },
];

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/account");

  const [profile, notifications] = await Promise.all([
    getProfile(user.id),
    getNotifications(user.id),
  ]);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const firstName = (profile?.name ?? "there").split(" ")[0];

  return (
    <div className="bg-cream">
      <div className="mx-auto flex min-h-[80vh] max-w-7xl gap-8 px-5 py-10 lg:px-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-xl2 bg-brand-gradient p-5 text-cream shadow-premium">
            <span className="text-xs uppercase tracking-widest text-sand">
              My Royal Experience
            </span>
            <p className="mb-6 mt-1 font-display text-lg">
              Welcome back, {firstName}
            </p>

            <nav className="space-y-1">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-cream/75 transition hover:bg-cream/10 hover:text-cream"
                >
                  <span className="flex items-center gap-3">
                    <Icon size={16} />
                    {label}
                  </span>
                  {label === "Notifications" && unreadCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-caramel text-[10px] text-espresso">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            <div className="mt-4 border-t border-cream/10 pt-4">
              <LogoutButton />
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-20 lg:pb-0">
          {/* Mobile branded header — same identity as the desktop sidebar,
              just shown inline instead of hidden behind a hamburger */}
          <div className="mb-6 rounded-xl2 bg-brand-gradient p-5 text-cream shadow-premium lg:hidden">
            <span className="text-xs uppercase tracking-widest text-sand">
              My Royal Experience
            </span>
            <p className="mt-1 font-display text-xl">
              Welcome back, {firstName}
            </p>
          </div>

          {children}
        </div>
      </div>

      {/* Mobile bottom tab bar replaces the old horizontal pill scroll */}
      <MobileDashboardNav unreadCount={unreadCount} />
    </div>
  );
}
