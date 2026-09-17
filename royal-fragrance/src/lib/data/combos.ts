import { createClient } from "@/lib/supabase/server";

export interface ComboItem {
  productId: string;
  variantId: string | null;
  quantity: number;
  productName: string;
  productSlug: string;
  productImage: string;
  price: number;
}

export interface Combo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  comboPrice: number;
  items: ComboItem[];
}

export async function getCombos(): Promise<Combo[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("combos")
      .select(
        "id, name, slug, description, image, combo_price, combo_items(product_id, variant_id, quantity, products(name, slug, base_price, product_images(url, position)), product_variants(price))"
      )
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      image: row.image,
      comboPrice: Number(row.combo_price),
      items: (row.combo_items ?? []).map((item: any) => ({
        productId: item.product_id,
        variantId: item.variant_id,
        quantity: item.quantity,
        productName: item.products?.name ?? "Product",
        productSlug: item.products?.slug ?? "",
        productImage: item.products?.product_images?.[0]?.url ?? "",
        price: item.product_variants?.price != null
          ? Number(item.product_variants.price)
          : Number(item.products?.base_price ?? 0),
      })),
    }));
  } catch {
    return [];
  }
}
