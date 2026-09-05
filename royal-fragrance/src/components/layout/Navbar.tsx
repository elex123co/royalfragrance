"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Menu,
  X,
  ShoppingBag,
  User,
  Store,
  BookOpen,
  Sparkles,
  Users,
} from "lucide-react";
import { useCart } from "@/context/CartContext";

const links = [
  { href: "/shop", label: "Shop", icon: Store },
  { href: "/about", label: "Our Story", icon: BookOpen },
  { href: "/future", label: "The Future", icon: Sparkles },
  { href: "/become-a-vendor", label: "Become a Vendor", icon: Users },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { itemCount } = useCart();
  const pathname = usePathname();

  // Close the menu automatically on navigation, and lock background scroll
  // while it's open so the page doesn't scroll behind the overlay.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-espresso/10 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <Link
          href="/"
          className="font-display text-xl tracking-wide text-espresso"
        >
          Royal <span className="text-caramel">Fragrance</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium tracking-wide text-rich transition hover:text-espresso"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/account"
            aria-label="Account"
            className="text-espresso transition hover:text-caramel"
          >
            <User size={20} />
          </Link>
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative text-espresso transition hover:text-caramel"
          >
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-caramel text-[10px] font-medium text-cream">
                {itemCount}
              </span>
            )}
          </Link>
        </div>

        <button
          className="text-espresso md:hidden"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Self-contained full-screen overlay — has its own top bar rather
          than positioning relative to the header's height, and sits above
          everything (z-[60] vs the header's z-50) so it can never render
          underneath the sticky header or depend on its exact height. */}
      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-cream md:hidden">
          <div className="flex items-center justify-between border-b border-espresso/10 px-5 py-4">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="font-display text-xl tracking-wide text-espresso"
            >
              Royal <span className="text-caramel">Fragrance</span>
            </Link>
            <button
              className="text-espresso"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <nav className="flex flex-col gap-1 px-5 py-4">
              {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-4 rounded-xl px-3 py-3.5 text-base font-medium transition ${
                      active
                        ? "bg-espresso text-cream"
                        : "text-espresso hover:bg-espresso/5"
                    }`}
                  >
                    <Icon size={20} />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-2 grid grid-cols-2 gap-3 border-t border-espresso/10 px-5 py-5">
              <Link
                href="/account"
                className="flex flex-col items-center gap-2 rounded-xl border border-espresso/15 py-4 text-sm font-medium text-espresso"
              >
                <User size={20} />
                Account
              </Link>
              <Link
                href="/cart"
                className="relative flex flex-col items-center gap-2 rounded-xl border border-espresso/15 py-4 text-sm font-medium text-espresso"
              >
                <ShoppingBag size={20} />
                Cart{itemCount > 0 ? ` (${itemCount})` : ""}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
