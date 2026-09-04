"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "./require-admin";

export interface ProductInput {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  categoryId: string | null;
  basePrice: number;
  /** The admin's chosen status. "draft" is always respected as-is; for
   * "active"/"out_of_stock" the real value actually saved is derived from
   * total variant stock below — see resolveStatus(). */
  status: "active" | "draft" | "out_of_stock";
  images: string[];
  variants: { size: string; price: number; stock: number }[];
}

/**
 * "draft" is a fully manual, admin-only state — a hidden product stays
 * hidden regardless of stock. "active" and "out_of_stock" are otherwise
 * derived automatically from total stock across all variants, so a
 * product goes out of stock the moment it sells out and comes back the
 * moment it's restocked, without the admin having to remember to flip it.
 */
function resolveStatus(
  requested: ProductInput["status"],
  totalStock: number
): ProductInput["status"] {
  if (requested === "draft") return "draft";
  return totalStock > 0 ? "active" : "out_of_stock";
}

export async function createProduct(input: ProductInput) {
  const { admin } = await requireAdmin();

  if (input.variants.length === 0) {
    return {
      success: false,
      error: "Add at least one size/variant with a quantity in stock.",
    };
  }

  const totalStock = input.variants.reduce((sum, v) => sum + v.stock, 0);
  const status = resolveStatus(input.status, totalStock);

  const { data: product, error } = await admin
    .from("products")
    .insert({
      name: input.name,
      slug: input.slug,
      description: input.description,
      short_description: input.shortDescription,
      category_id: input.categoryId,
      base_price: input.basePrice,
      status,
    })
    .select()
    .single();

  if (error || !product) {
    return { success: false, error: error?.message ?? "Could not create product" };
  }

  if (input.images.length > 0) {
    await admin.from("product_images").insert(
      input.images.map((url, position) => ({
        product_id: product.id,
        url,
        position,
      }))
    );
  }

  await admin.from("product_variants").insert(
    input.variants.map((v) => ({
      product_id: product.id,
      size: v.size,
      price: v.price,
      stock: v.stock,
    }))
  );

  await admin.from("audit_logs").insert({
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
  const { admin } = await requireAdmin();

  if (input.variants.length === 0) {
    return {
      success: false,
      error: "Add at least one size/variant with a quantity in stock.",
    };
  }

  const totalStock = input.variants.reduce((sum, v) => sum + v.stock, 0);
  const status = resolveStatus(input.status, totalStock);

  const { error } = await admin
    .from("products")
    .update({
      name: input.name,
      slug: input.slug,
      description: input.description,
      short_description: input.shortDescription,
      category_id: input.categoryId,
      base_price: input.basePrice,
      status,
    })
    .eq("id", productId);

  if (error) return { success: false, error: error.message };

  await admin.from("product_images").delete().eq("product_id", productId);
  if (input.images.length > 0) {
    await admin.from("product_images").insert(
      input.images.map((url, position) => ({
        product_id: productId,
        url,
        position,
      }))
    );
  }

  await admin.from("product_variants").delete().eq("product_id", productId);
  await admin.from("product_variants").insert(
    input.variants.map((v) => ({
      product_id: productId,
      size: v.size,
      price: v.price,
      stock: v.stock,
    }))
  );

  revalidatePath("/admin/products");
  revalidatePath(`/product/${input.slug}`);
  revalidatePath("/shop");
  return { success: true };
}

export async function updateProductStatus(
  productId: string,
  status: "active" | "draft" | "out_of_stock"
) {
  const { admin } = await requireAdmin();

  // Manual override from the products table's inline status dropdown.
  // "draft" is always respected; switching to "active" while stock is
  // actually zero is blocked, since that would misrepresent availability.
  if (status === "active") {
    const { data: variants } = await admin
      .from("product_variants")
      .select("stock")
      .eq("product_id", productId);
    const totalStock = (variants ?? []).reduce((sum, v) => sum + v.stock, 0);
    if (totalStock <= 0) {
      return {
        success: false,
        error: "Can't mark active — this product has zero stock. Restock it first.",
      };
    }
  }

  const { error } = await admin
    .from("products")
    .update({ status })
    .eq("id", productId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { success: true };
}

export async function deleteProduct(productId: string) {
  const { admin } = await requireAdmin();

  const { error } = await admin.from("products").delete().eq("id", productId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { success: true };
}
