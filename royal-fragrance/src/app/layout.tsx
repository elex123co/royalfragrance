import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { CartProvider } from "@/context/CartContext";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600"],
});

const SITE_URL = "https://royalfragrancegallery.com";
const LOGO_URL =
  "https://res.cloudinary.com/dtchp470a/image/upload/v1788705368/WhatsApp_Image_2026-09-05_at_17.32.39__1_-removebg-preview_1_qaxnfw.png";
const DEFAULT_DESCRIPTION =
  "Royal Fragrance is a luxury perfume brand delivering carefully selected fragrances today, while building toward becoming an original fragrance house for tomorrow. Shop Men's, Women's, Unisex, and Oud fragrances online in Nigeria.";

export const metadata: Metadata = {
  // metadataBase resolves every relative OG/Twitter image URL below against
  // your real domain — without it, social previews silently break.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Royal Fragrance — More Than a Fragrance",
    // Every page that sets its own title (e.g. "Oud Noir") gets this
    // appended automatically: "Oud Noir | Royal Fragrance" — consistent
    // branding in every search result and browser tab without repeating
    // it on every single page.
    template: "%s | Royal Fragrance",
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "Royal Fragrance",
    "perfume Nigeria",
    "fragrance store Nigeria",
    "buy perfume online Nigeria",
    "oud perfume",
    "luxury fragrance",
    "men's perfume",
    "women's perfume",
    "unisex fragrance",
  ],
  authors: [{ name: "Royal Fragrance" }],
  icons: {
    icon: LOGO_URL,
    shortcut: LOGO_URL,
    apple: LOGO_URL,
  },
  openGraph: {
    type: "website",
    siteName: "Royal Fragrance",
    title: "Royal Fragrance — More Than a Fragrance",
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: LOGO_URL, width: 512, height: 512, alt: "Royal Fragrance" }],
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Royal Fragrance — More Than a Fragrance",
    description: DEFAULT_DESCRIPTION,
    images: [LOGO_URL],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  themeColor: "#1E120C",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Royal Fragrance",
    url: SITE_URL,
    logo: LOGO_URL,
    description: DEFAULT_DESCRIPTION,
    sameAs: [],
  };

  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <head>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body>
        <CartProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
          <AssistantWidget />
          <InstallPrompt />
        </CartProvider>
      </body>
    </html>
  );
}
