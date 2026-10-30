import { createAdminClient } from "@/lib/supabase/server";
import type { GalleryItem, GalleryStatus } from "@/lib/types/gallery";

export async function getGalleryItems(): Promise<GalleryItem[]> {
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("product_gallery")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  const productIds = Array.from(new Set((rows ?? []).map((r: any) => r.product_id).filter(Boolean)));
  const products = new Map<string, any>();
  if (productIds.length > 0) {
    const { data } = await admin
      .from("products")
      .select(
        "id, name, slug, description, short_description, category_id, type, status, fragrance_notes, product_variants(size, price, stock), product_images(url, position)"
      )
      .in("id", productIds);
    for (const p of data ?? []) products.set(p.id, p);
  }

  return (rows ?? []).map((r: any) => {
    const p = r.product_id ? products.get(r.product_id) : null;
    const copy = r.ai_data?.copy;
    return {
      id: r.id,
      url: r.url,
      status: r.status as GalleryStatus,
      note: r.note,
      createdAt: r.created_at,
      product: p
        ? {
            id: p.id,
            name: p.name,
            slug: p.slug,
            caption: p.short_description ?? "",
            description: p.description ?? "",
            categoryId: p.category_id,
            type: p.type ?? "",
            status: p.status,
            notesSource: copy?.notesSource ?? "none",
            notes: p.fragrance_notes ?? { top: [], heart: [], base: [] },
            variants: (p.product_variants ?? []).map((v: any) => ({
              size: v.size,
              price: Number(v.price),
              stock: Number(v.stock),
            })),
            images: (p.product_images ?? [])
              .sort((a: any, b: any) => a.position - b.position)
              .map((i: any) => i.url),
          }
        : null,
    };
  });
}
