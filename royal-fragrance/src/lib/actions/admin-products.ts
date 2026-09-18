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
  discountType: "percentage" | "fixed_amount" | null;
  discountValue: number | null;
  /** Extra promo-code-unlockable tiers, on top of the public sale discount
   * above — e.g. this product carries both a 10% and a 15% tier, and
   * whichever matching promo code a customer has unlocks that specific one. */
  discountTiers: { discountType: "percentage" | "fixed_amount"; discountValue: number }[];
  colors: string[];
  type: string;
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
      base_price: input.variants[0]?.price ?? input.basePrice,
      status,
      discount_type: input.discountType,
      discount_value: input.discountValue,
      colors: input.colors,
      type: input.type || null,
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

  if (input.discountTiers.length > 0) {
    const { error: tierError } = await admin.from("product_discount_tiers").insert(
      input.discountTiers.map((t) => ({
        product_id: product.id,
        discount_type: t.discountType,
        discount_value: t.discountValue,
      }))
    );
    if (tierError) {
      // The product itself saved fine — don't claim total failure, but
      // don't silently pretend the tiers saved either, the way this used
      // to fail quietly.
      return {
        success: true,
        productId: product.id,
        warning: "Product saved, but discount tiers failed to save: " + tierError.message,
      };
    }
  }

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
      base_price: input.variants[0]?.price ?? input.basePrice,
      status,
      discount_type: input.discountType,
      discount_value: input.discountValue,
      colors: input.colors,
      type: input.type || null,
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

  // Replace the full set of discount tiers — simplest correct way to sync
  // a variable-length list without diffing individual adds/removes.
  await admin.from("product_discount_tiers").delete().eq("product_id", productId);
  let tierWarning: string | undefined;
  if (input.discountTiers.length > 0) {
    const { error: tierError } = await admin.from("product_discount_tiers").insert(
      input.discountTiers.map((t) => ({
        product_id: productId,
        discount_type: t.discountType,
        discount_value: t.discountValue,
      }))
    );
    if (tierError) {
      tierWarning = "Product saved, but discount tiers failed to save: " + tierError.message;
    }
  }

  revalidatePath("/admin/products");
  revalidatePath(`/product/${input.slug}`);
  revalidatePath("/shop");
  if (tierWarning) return { success: true, warning: tierWarning };
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

  const { count: orderCount } = await admin
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  if ((orderCount ?? 0) > 0) {
    return {
      success: false,
      error:
        "This product has real order history and can't be deleted — deleting it would break those past orders' records. Set it to \"Draft\" instead to hide it from the shop while keeping order history intact.",
    };
  }

  const { error } = await admin.from("products").delete().eq("id", productId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { success: true };
}

export async function applyDiscountTierToAllProducts(
  discountType: "percentage" | "fixed_amount",
  discountValue: number
) {
  const { admin } = await requireAdmin();

  if (!discountValue || discountValue <= 0) {
    return { success: false, error: "Enter a discount value greater than 0." };
  }

  const { data: products, error: productsError } = await admin
    .from("products")
    .select("id")
    .neq("status", "draft");

  if (productsError) return { success: false, error: productsError.message };
  if (!products || products.length === 0) {
    return { success: false, error: "No products found." };
  }

  // upsert with onConflict on the tier's unique (product_id, discount_type,
  // discount_value) constraint — silently skips products that already
  // carry this exact tier instead of erroring on the duplicate.
  const { error } = await admin.from("product_discount_tiers").upsert(
    products.map((p) => ({
      product_id: p.id,
      discount_type: discountType,
      discount_value: discountValue,
    })),
    { onConflict: "product_id,discount_type,discount_value", ignoreDuplicates: true }
  );

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { success: true, count: products.length };
}
