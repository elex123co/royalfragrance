"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ShoppingBag, User } from "lucide-react";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "Our Story" },
  { href: "/future", label: "The Future" },
  { href: "/become-a-vendor", label: "Become a Vendor" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

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
            href="/login"
            aria-label="Account"
            className="text-espresso transition hover:text-caramel"
          >
            <User size={20} />
          </Link>
          <Link
            href="/cart"
            aria-label="Cart"
            className="text-espresso transition hover:text-caramel"
          >
            <ShoppingBag size={20} />
          </Link>
        </div>

        <button
          className="text-espresso md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-espresso/10 bg-cream px-5 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-rich"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-6 pt-2">
              <Link href="/login" className="text-sm text-espresso">
                Account
              </Link>
              <Link href="/cart" className="text-sm text-espresso">
                Cart
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
