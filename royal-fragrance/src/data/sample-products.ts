import type { Product } from "@/lib/types/product";

/**
 * Temporary in-memory product data used to render the storefront before the
 * Supabase `products` table is populated. Replace all usages of this file
 * with real queries against the database (see /supabase/schema.sql).
 */
export const sampleProducts: Product[] = [
  {
    id: "1",
    slug: "oud-noir",
    name: "Oud Noir",
    shortDescription: "A bold, smoky oud with deep amber warmth.",
    description:
      "Oud Noir opens with smoked oud and dark spice, settling into a rich amber and leather base built for the confident and unforgettable.",
    category: "Oud",
    price: 45000,
    image: "", // placeholder — replace with real product photography via /admin/products
    notes: {
      top: ["Smoked Oud", "Black Pepper"],
      heart: ["Rose", "Saffron"],
      base: ["Amber", "Leather"],
    },
    status: "active",
    featured: true,
  },
  {
    id: "2",
    slug: "amber-gold",
    name: "Amber Gold",
    shortDescription: "Warm amber wrapped in golden vanilla.",
    description:
      "A radiant, honeyed amber fragrance layered with vanilla and warm musk — designed for evenings that linger.",
    category: "Unisex Fragrances",
    price: 38000,
    image: "", // placeholder — replace with real product photography via /admin/products
    notes: {
      top: ["Bergamot", "Cardamom"],
      heart: ["Amber", "Vanilla"],
      base: ["Musk", "Sandalwood"],
    },
    status: "active",
    featured: true,
  },
  {
    id: "3",
    slug: "velvet-musk",
    name: "Velvet Musk",
    shortDescription: "Soft musk with a whisper of white florals.",
    description:
      "Velvet Musk is quiet luxury — creamy musk, soft florals, and skin-close warmth for everyday elegance.",
    category: "Women's Fragrances",
    price: 32000,
    image: "", // placeholder — replace with real product photography via /admin/products
    notes: {
      top: ["Pear", "Jasmine"],
      heart: ["White Musk", "Iris"],
      base: ["Cedarwood", "Vanilla"],
    },
    status: "active",
    featured: true,
  },
  {
    id: "4",
    slug: "caramel-blaze",
    name: "Caramel Blaze",
    shortDescription: "Caramel-kissed spice for the bold.",
    description:
      "A magnetic blend of caramel, tobacco leaf and warm spice — Caramel Blaze is built for the unforgettable entrance.",
    category: "Men's Fragrances",
    price: 41000,
    image: "", // placeholder — replace with real product photography via /admin/products
    notes: {
      top: ["Cinnamon", "Bergamot"],
      heart: ["Caramel", "Tobacco"],
      base: ["Vetiver", "Amber"],
    },
    status: "active",
    featured: true,
  },
];

export const categories = [
  "Men's Fragrances",
  "Women's Fragrances",
  "Unisex Fragrances",
  "Oud",
  "Designer Fragrances",
  "Niche Fragrances",
  "Gift Sets",
  "New Arrivals",
  "Best Sellers",
];
