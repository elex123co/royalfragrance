import Link from "next/link";
import { Instagram, Facebook, Twitter, Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-espresso text-cream">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-5 lg:px-8">
        <div>
          <h3 className="font-display text-xl">
            Royal <span className="text-caramel">Fragrance</span>
          </h3>
          <p className="mt-3 max-w-xs text-sm text-cream/70">
            A luxury fragrance brand for today, and an original perfume house
            in the making. More than a scent — a growing vision.
          </p>
          <div className="mt-5 flex gap-4">
            <Instagram size={18} className="text-cream/70 hover:text-caramel" />
            <Facebook size={18} className="text-cream/70 hover:text-caramel" />
            <Twitter size={18} className="text-cream/70 hover:text-caramel" />
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-widest text-caramel">
            Contact
          </h4>
          <ul className="space-y-3 text-sm text-cream/70">
            <li className="flex items-start gap-2.5">
              <Phone size={15} className="mt-0.5 shrink-0 text-caramel" />
              <a href="tel:+2347040218594" className="hover:text-cream">
                0704 021 8594
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <Mail size={15} className="mt-0.5 shrink-0 text-caramel" />
              <a
                href="mailto:oyinkansolaelizabetholutunde@gmail.com"
                className="break-all hover:text-cream"
              >
                oyinkansolaelizabetholutunde@gmail.com
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin size={15} className="mt-0.5 shrink-0 text-caramel" />
              <span>Block 314, Abesan Estate, Ipaja, Lagos</span>
            </li>
          </ul>
        </div>

        <FooterColumn
          title="Shop"
          links={[
            { href: "/shop", label: "All Fragrances" },
            { href: "/shop?category=new-arrivals", label: "New Arrivals" },
            { href: "/shop?category=best-sellers", label: "Best Sellers" },
            { href: "/shop?category=gift-sets", label: "Gift Sets" },
          ]}
        />

        <FooterColumn
          title="Brand"
          links={[
            { href: "/about", label: "Our Story" },
            { href: "/future", label: "The Future of Royal Fragrance" },
            { href: "/become-a-vendor", label: "Become a Vendor" },
          ]}
        />

        <FooterColumn
          title="Support"
          links={[
            { href: "/account", label: "My Account" },
            { href: "/account/orders", label: "Track Order" },
            { href: "/privacy", label: "Privacy Policy" },
            { href: "/terms", label: "Terms & Conditions" },
          ]}
        />
      </div>

      <div className="border-t border-cream/10 px-5 py-6 text-center text-xs text-cream/50">
        © {new Date().getFullYear()} Royal Fragrance. All rights reserved.
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-semibold uppercase tracking-widest text-caramel">
        {title}
      </h4>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-cream/70 transition hover:text-cream"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
