import { createClient } from "@/lib/supabase/server";
import { sampleProducts } from "@/data/sample-products";
import type { Product } from "@/lib/types/product";
import { applyDiscount } from "@/lib/utils/discount";

const CORE_SELECT =
  "*, categories(name), product_images(url, position), product_variants(*)";

/**
 * Picks the single "best" tier to advertise on a badge — highest
 * percentage tier if any exist, otherwise the largest fixed-amount tier.
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
 * Fetched as a completely separate query from the core product data,
 * deliberately — this table is newer and less proven than the rest of the
 * schema, and a single missing/broken related table should never be able
 * to take down product listings (and their images) for the whole site.
 * Any failure here — table doesn't exist, network hiccup, whatever —
 * degrades to "no tier badges shown," never to "no products shown."
 */
async function fetchTierLabelsByProduct(
  supabase: ReturnType<typeof createClient>,
  productIds: string[]
): Promise<Record<string, string | undefined>> {
  if (productIds.length === 0) return {};
  try {
    const { data, error } = await supabase
      .from("product_discount_tiers")
      .select("product_id, discount_type, discount_value")
      .in("product_id", productIds);

    if (error || !data) return {};

    const grouped: Record<string, { discount_type: string; discount_value: number }[]> = {};
    for (const row of data) {
      if (!grouped[row.product_id]) grouped[row.product_id] = [];
      grouped[row.product_id].push({
        discount_type: row.discount_type,
        discount_value: Number(row.discount_value),
      });
    }

    const labels: Record<string, string | undefined> = {};
    for (const [productId, tiers] of Object.entries(grouped)) {
      labels[productId] = bestTierLabel(tiers);
    }
    return labels;
  } catch {
    return {};
  }
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
 */
function mapRow(row: any, promoTierLabel?: string): Product {
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
    promoTierLabel,
    colors: row.colors ?? [],
    productType: row.type ?? undefined,
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
      .select(CORE_SELECT)
      .eq("status", "active")
      .limit(4);

    if (error || !data || data.length === 0) return sampleProducts;

    const tierLabels = await fetchTierLabelsByProduct(supabase, data.map((r) => r.id));
    return data.map((row) => mapRow(row, tierLabels[row.id]));
  } catch {
    return sampleProducts;
  }
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .select(CORE_SELECT)
      .in("status", ["active", "out_of_stock"])
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) return sampleProducts;

    const tierLabels = await fetchTierLabelsByProduct(supabase, data.map((r) => r.id));
    return data.map((row) => mapRow(row, tierLabels[row.id]));
  } catch {
    return sampleProducts;
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .select(CORE_SELECT)
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return sampleProducts.find((p) => p.slug === slug) ?? null;
    }

    const tierLabels = await fetchTierLabelsByProduct(supabase, [data.id]);
    return mapRow(data, tierLabels[data.id]);
  } catch {
    return sampleProducts.find((p) => p.slug === slug) ?? null;
  }
}
