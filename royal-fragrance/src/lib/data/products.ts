import { createClient } from "@/lib/supabase/server";
import { sampleProducts } from "@/data/sample-products";
import type { Product } from "@/lib/types/product";
import { applyDiscount } from "@/lib/utils/discount";

/**
 * Picks the single "best" tier to advertise on a badge — highest
 * percentage tier if any exist, otherwise the largest fixed-amount tier.
 * Percentage tiers are preferred because they're more universally
 * understandable at a glance than a bare Naira figure.
 */
function bestTierLabel(tiers: { discount_type: string; discount_value: number }[]): string | undefined {
  if (!tiers || tiers.length === 0) return undefined;
  const percentageTiers = tiers.filter((t) => t.discount_type === "percentage");
  if (percentageTiers.length > 0) {
    const best = Math.max(...percentageTiers.map((t) => Number(t.discount_value)));
    return `Up to ${best}% off with code`;
  }
  const best = Math.max(...tiers.map((t) => Number(t.discount_value)));
  return `Up to ₦${best.toLocaleString()} off with code`;
}

/**
 * Maps a Supabase `products` row (joined with images + variants) into the
 * frontend `Product` shape. Falls back to sample data when the table is
 * empty or unreachable, so the storefront still renders during setup.
 *
 * A discount on the product is baked into `price` / variant `price` here,
 * once, at the data layer — everywhere downstream (cards, product page,
 * cart, checkout) just uses `price` as-is and automatically charges the
 * discounted amount with zero extra logic. `originalPrice` is only set
 * when a discount is actually active, purely for strikethrough display.
 *
 * `promoTierLabel`, separately, surfaces that a promo-code-only discount
 * exists — without ever changing the shown price or revealing which code
 * unlocks it — so customers aren't left with zero signal that a code
 * might be worth looking for.
 */
function mapRow(row: any): Product {
  const discountType = row.discount_type ?? null;
  const discountValue = row.discount_value != null ? Number(row.discount_value) : null;

  const rawPrice =
    row.product_variants?.[0]?.price != null
      ? Number(row.product_variants[0].price)
      : Number(row.base_price ?? 0);
  const effectivePrice = applyDiscount(rawPrice, discountType, discountValue);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description ?? "",
    description: row.description ?? "",
    category: row.categories?.name ?? "Uncategorized",
    price: effectivePrice,
    originalPrice: effectivePrice !== rawPrice ? rawPrice : undefined,
    discountType: discountType ?? undefined,
    discountValue: discountValue ?? undefined,
    promoTierLabel: bestTierLabel(row.product_discount_tiers ?? []),
    image: row.product_images?.[0]?.url ?? "",
    notes: row.fragrance_notes ?? undefined,
    variants: (row.product_variants ?? []).map((v: any) => {
      const variantRaw = Number(v.price);
      const variantEffective = applyDiscount(variantRaw, discountType, discountValue);
      return {
        id: v.id,
        size: v.size,
        price: variantEffective,
        originalPrice: variantEffective !== variantRaw ? variantRaw : undefined,
        stock: v.stock,
      };
    }),
    status: row.status,
    featured: Boolean(row.featured),
  };
}

export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        "*, categories(name), product_images(url, position), product_variants(*), product_discount_tiers(discount_type, discount_value)"
      )
      .eq("status", "active")
      .limit(4);

    if (error || !data || data.length === 0) return sampleProducts;
    return data.map(mapRow);
  } catch {
    return sampleProducts;
  }
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        "*, categories(name), product_images(url, position), product_variants(*), product_discount_tiers(discount_type, discount_value)"
      )
      .in("status", ["active", "out_of_stock"])
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) return sampleProducts;
    return data.map(mapRow);
  } catch {
    return sampleProducts;
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        "*, categories(name), product_images(url, position), product_variants(*), product_discount_tiers(discount_type, discount_value)"
      )
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return sampleProducts.find((p) => p.slug === slug) ?? null;
    }
    return mapRow(data);
  } catch {
    return sampleProducts.find((p) => p.slug === slug) ?? null;
  }
}
