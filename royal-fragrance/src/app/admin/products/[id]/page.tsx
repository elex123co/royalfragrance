import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/data/categories";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "Edit Product — Admin — Royal Fragrance" };

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createAdminClient();
  const [{ data: product }, categories] = await Promise.all([
    supabase
      .from("products")
      .select(
        "*, product_images(url, position), product_variants(id, size, price, stock)"
      )
      .eq("id", params.id)
      .single(),
    getCategories(),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-espresso">Edit Product</h1>
      <ProductForm
        categories={categories}
        productId={product.id}
        initial={{
          name: product.name,
          slug: product.slug,
          description: product.description ?? "",
          shortDescription: product.short_description ?? "",
          categoryId: product.category_id,
          basePrice: Number(product.base_price),
          status: product.status,
          imageUrl: product.product_images?.[0]?.url ?? "",
          variants: (product.product_variants ?? []).map((v: any) => ({
            size: v.size,
            price: Number(v.price),
            stock: v.stock,
          })),
        }}
      />
    </div>
  );
}
