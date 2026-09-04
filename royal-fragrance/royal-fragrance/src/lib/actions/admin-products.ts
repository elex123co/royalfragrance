"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

export interface ProductInput {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  categoryId: string | null;
  basePrice: number;
  status: "active" | "draft" | "out_of_stock";
  imageUrl: string;
  variants: { size: string; price: number; stock: number }[];
}

export async function createProduct(input: ProductInput) {
  const supabase = createAdminClient();

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      name: input.name,
      slug: input.slug,
      description: input.description,
      short_description: input.shortDescription,
      category_id: input.categoryId,
      base_price: input.basePrice,
      status: input.status,
    })
    .select()
    .single();

  if (error || !product) {
    return { success: false, error: error?.message ?? "Could not create product" };
  }

  if (input.imageUrl) {
    await supabase
      .from("product_images")
      .insert({ product_id: product.id, url: input.imageUrl, position: 0 });
  }

  if (input.variants.length > 0) {
    await supabase.from("product_variants").insert(
      input.variants.map((v) => ({
        product_id: product.id,
        size: v.size,
        price: v.price,
        stock: v.stock,
      }))
    );
  }

  await supabase.from("audit_logs").insert({
    action: "product.created",
    entity_type: "product",
    entity_id: product.id,
    metadata: { name: input.name },
  });

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { success: true, productId: product.id };
}

export async function updateProduct(productId: string, input: ProductInput) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("products")
    .update({
      name: input.name,
      slug: input.slug,
      description: input.description,
      short_description: input.shortDescription,
      category_id: input.categoryId,
      base_price: input.basePrice,
      status: input.status,
    })
    .eq("id", productId);

  if (error) return { success: false, error: error.message };

  if (input.imageUrl) {
    await supabase.from("product_images").delete().eq("product_id", productId);
    await supabase
      .from("product_images")
      .insert({ product_id: productId, url: input.imageUrl, position: 0 });
  }

  await supabase.from("product_variants").delete().eq("product_id", productId);
  if (input.variants.length > 0) {
    await supabase.from("product_variants").insert(
      input.variants.map((v) => ({
        product_id: productId,
        size: v.size,
        price: v.price,
        stock: v.stock,
      }))
    );
  }

  revalidatePath("/admin/products");
  revalidatePath(`/product/${input.slug}`);
  revalidatePath("/shop");
  return { success: true };
}

export async function updateProductStatus(
  productId: string,
  status: "active" | "draft" | "out_of_stock"
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("products")
    .update({ status })
    .eq("id", productId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { success: true };
}

export async function deleteProduct(productId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("products").delete().eq("id", productId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { success: true };
}
