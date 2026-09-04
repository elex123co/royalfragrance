import { createClient } from "@/lib/supabase/server";
import { sampleProducts } from "@/data/sample-products";
import type { Product } from "@/lib/types/product";

/**
 * Maps a Supabase `products` row (joined with images + variants) into the
 * frontend `Product` shape. Falls back to sample data when the table is
 * empty or unreachable, so the storefront still renders during setup.
 */
function mapRow(row: any): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description ?? "",
    description: row.description ?? "",
    category: row.categories?.name ?? "Uncategorized",
    price:
      row.product_variants?.[0]?.price != null
        ? Number(row.product_variants[0].price)
        : Number(row.base_price ?? 0),
    image: row.product_images?.[0]?.url ?? "/images/placeholder.jpg",
    notes: row.fragrance_notes ?? undefined,
    variants: (row.product_variants ?? []).map((v: any) => ({
      id: v.id,
      size: v.size,
      price: Number(v.price),
      stock: v.stock,
    })),
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
        "*, categories(name), product_images(url, position), product_variants(*)"
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
        "*, categories(name), product_images(url, position), product_variants(*)"
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
        "*, categories(name), product_images(url, position), product_variants(*)"
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
