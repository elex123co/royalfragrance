import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/data/categories";
import { ProductForm } from "@/components/admin/ProductForm";

// Always fetch live data — admin dashboards must never serve a stale build-time snapshot.
export const dynamic = "force-dynamic";

export const metadata = { title: "Edit Product — Admin — Royal Fragrance" };

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createAdminClient();
  const [{ data: product }, categories, { data: allPromoCodes }, { data: linkedCodes }] =
    await Promise.all([
      supabase
        .from("products")
        .select(
          "*, product_images(url, position), product_variants(id, size, price, stock)"
        )
        .eq("id", params.id)
        .single(),
      getCategories(),
      supabase
        .from("promo_codes")
        .select("id, code, discount_type, discount_value")
        .order("code"),
      supabase.from("promo_code_products").select("promo_code_id").eq("product_id", params.id),
    ]);

  if (!product) notFound();

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-espresso">Edit Product</h1>
      <ProductForm
        categories={categories}
        productId={product.id}
        allPromoCodes={allPromoCodes ?? []}
        initialPromoCodeIds={(linkedCodes ?? []).map((l) => l.promo_code_id)}
        initial={{
          name: product.name,
          slug: product.slug,
          description: product.description ?? "",
          shortDescription: product.short_description ?? "",
          categoryId: product.category_id,
          basePrice: Number(product.base_price),
          status: product.status,
          images: (product.product_images ?? [])
            .sort((a: any, b: any) => a.position - b.position)
            .map((img: any) => img.url),
          variants: (product.product_variants ?? []).map((v: any) => ({
            size: v.size,
            price: Number(v.price),
            stock: v.stock,
          })),
          discountType: product.discount_type,
          discountValue: product.discount_value != null ? Number(product.discount_value) : null,
        }}
      />
    </div>
  );
}
