"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, X, type LucideIcon } from "lucide-react";
import { LogoutButton } from "@/components/account/LogoutButton";

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export function DashboardMobileNav({
  primaryTabs,
  moreLinks,
  moreLabel = "More",
}: {
  primaryTabs: NavLink[];
  moreLinks: NavLink[];
  moreLabel?: string;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = moreLinks.some((l) => l.href === pathname);
  const moreBadge = moreLinks.reduce((sum, l) => sum + (l.badge ?? 0), 0);

  return (
    <>
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-espresso/60 lg:hidden"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-cream p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-lg text-espresso">{moreLabel}</p>
              <button onClick={() => setMoreOpen(false)} aria-label="Close">
                <X size={20} className="text-espresso" />
              </button>
            </div>
            <div className="space-y-1">
              {moreLinks.map(({ href, label, icon: Icon, badge }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-3 text-sm text-espresso hover:bg-espresso/5"
                >
                  <span className="flex items-center gap-3">
                    <Icon size={18} />
                    {label}
                  </span>
                  {!!badge && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-caramel text-[10px] text-espresso">
                      {badge}
                    </span>
                  )}
                </Link>
              ))}
              <div className="mt-2 border-t border-espresso/10 pt-2">
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-espresso/10 bg-cream/95 backdrop-blur-md lg:hidden">
        {primaryTabs.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] ${
                active ? "text-caramel" : "text-espresso/60"
              }`}
            >
              <Icon size={20} />
              {label}
              {!!badge && (
                <span className="absolute right-5 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-caramel text-[9px] text-espresso">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
        {moreLinks.length > 0 && (
          <button
            onClick={() => setMoreOpen(true)}
            className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] ${
              isMoreActive ? "text-caramel" : "text-espresso/60"
            }`}
          >
            <MoreHorizontal size={20} />
            More
            {moreBadge > 0 && (
              <span className="absolute right-5 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-caramel text-[9px] text-espresso">
                {moreBadge}
              </span>
            )}
          </button>
        )}
      </nav>
    </>
  );
}
