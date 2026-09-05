import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { CartProvider } from "@/context/CartContext";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";

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

export const metadata: Metadata = {
  title: "Royal Fragrance — More Than a Fragrance",
  description:
    "Royal Fragrance is a luxury perfume brand delivering carefully selected fragrances today, while building toward becoming an original fragrance house for tomorrow.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <CartProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
          <AssistantWidget />
        </CartProvider>
      </body>
    </html>
  );
}
