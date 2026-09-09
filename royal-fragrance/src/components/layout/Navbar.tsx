"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Menu,
  X,
  ShoppingBag,
  User,
  Store,
  BookOpen,
  Sparkles,
  Users,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { createClient } from "@/lib/supabase/client";

const LOGO_URL =
  "https://res.cloudinary.com/dtchp470a/image/upload/v1788705368/WhatsApp_Image_2026-09-05_at_17.32.39__1_-removebg-preview_1_qaxnfw.png";

const links = [
  { href: "/shop", label: "Shop", icon: Store },
  { href: "/about", label: "Our Story", icon: BookOpen },
  { href: "/future", label: "The Future", icon: Sparkles },
  { href: "/become-a-vendor", label: "Become a Vendor", icon: Users },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null); // null = still checking
  const { itemCount } = useCart();
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // A single ambiguous "Account" icon didn't tell new visitors that
  // creating an account was even an option — they'd tap it, land on
  // login, and have no obvious path to sign up. Knowing whether someone
  // is actually logged in lets us show "Login" + "Sign Up" as two
  // distinct, honest options instead of one guess-and-hope icon.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const menu = open && (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-cream md:hidden">
      <div className="flex items-center justify-between border-b border-espresso/10 px-5 py-4">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2 font-display text-xl tracking-wide text-espresso"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-leather p-1.5 shadow-sm">
            <Image src={LOGO_URL} alt="Royal Fragrance" width={36} height={36} className="h-full w-full object-contain" />
          </span>
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
          {loggedIn ? (
            <Link
              href="/dashboard"
              className="flex flex-col items-center gap-2 rounded-xl border border-espresso/15 py-4 text-sm font-medium text-espresso"
            >
              <User size={20} />
              My Account
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="flex flex-col items-center gap-2 rounded-xl border border-espresso/15 py-4 text-sm font-medium text-espresso"
              >
                <LogIn size={20} />
                Login
              </Link>
              <Link
                href="/register"
                className="flex flex-col items-center gap-2 rounded-xl border border-caramel bg-caramel/10 py-4 text-sm font-medium text-espresso"
              >
                <UserPlus size={20} />
                Sign Up
              </Link>
            </>
          )}
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
  );

  const isHome = pathname === "/";

  return (
    <header
      className={
        isHome
          ? "fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/10 backdrop-blur-md"
          : "sticky top-0 z-50 border-b border-espresso/10 bg-cream/90 backdrop-blur-md"
      }
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-xl tracking-wide text-espresso"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-leather p-1.5 shadow-sm">
            <Image src={LOGO_URL} alt="Royal Fragrance" width={36} height={36} className="h-full w-full object-contain" />
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                isHome
                  ? "text-sm font-medium tracking-wide text-cream/85 transition hover:text-cream"
                  : "text-sm font-medium tracking-wide text-rich transition hover:text-espresso"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          {loggedIn === false && (
            <Link
              href="/login"
              className={
                isHome
                  ? "text-sm font-medium text-cream/85 transition hover:text-cream"
                  : "text-sm font-medium text-rich transition hover:text-espresso"
              }
            >
              Login
            </Link>
          )}
          {loggedIn === false && (
            <Link
              href="/register"
              className={
                isHome
                  ? "rounded-full border border-cream/40 px-4 py-1.5 text-sm font-medium text-cream transition hover:bg-cream/10"
                  : "rounded-full bg-espresso px-4 py-1.5 text-sm font-medium text-cream transition hover:bg-rich"
              }
            >
              Sign Up
            </Link>
          )}
          {loggedIn && (
            <Link
              href="/dashboard"
              aria-label="Account"
              className={
                isHome
                  ? "text-cream/85 transition hover:text-cream"
                  : "text-espresso transition hover:text-caramel"
              }
            >
              <User size={20} />
            </Link>
          )}
          <Link
            href="/cart"
            aria-label="Cart"
            className={
              isHome
                ? "relative text-cream/85 transition hover:text-cream"
                : "relative text-espresso transition hover:text-caramel"
            }
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
          className={isHome ? "text-cream md:hidden" : "text-espresso md:hidden"}
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {mounted && menu && createPortal(menu, document.body)}
    </header>
  );
}
