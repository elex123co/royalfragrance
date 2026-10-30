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

function baseSlug(input: ProductInput) {
  const fromName = input.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const raw = (input.slug || "").trim() || fromName;
  return raw.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/(^-|-$)/g, "") || "product";
}

/**
 * Returns a slug no other product uses. A name that matches an existing
 * product gets "-2", "-3", and so on, instead of failing with a database
 * "duplicate key" error. When editing, the product's own current slug does
 * not count as a clash.
 */
async function uniqueSlug(
  admin: Awaited<ReturnType<typeof requireAdmin>>["admin"],
  input: ProductInput,
  excludeProductId?: string
) {
  const base = baseSlug(input);
  let query = admin.from("products").select("id, slug").like("slug", `${base}%`);
  if (excludeProductId) query = query.neq("id", excludeProductId);
  const { data } = await query;
  const taken = new Set((data ?? []).map((p) => p.slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

function variantProblem(input: ProductInput) {
  for (const v of input.variants) {
    if (!v.size.trim()) return "Every size needs a name (for example 50ml or One Size).";
    if (!(v.price > 0)) return `Enter a price for the ${v.size.trim()} size.`;
  }
  return null;
}

export async function createProduct(input: ProductInput) {
  const { admin } = await requireAdmin();

  if (input.variants.length === 0) {
    return {
      success: false,
      error: "Add at least one size/variant with a quantity in stock.",
    };
  }

  const problem = variantProblem(input);
  if (problem) return { success: false, error: problem };

  const totalStock = input.variants.reduce((sum, v) => sum + v.stock, 0);
  const status = resolveStatus(input.status, totalStock);
  const slug = await uniqueSlug(admin, input);

  const { data: product, error } = await admin
    .from("products")
    .insert({
      name: input.name,
      slug,
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
  return { success: true, productId: product.id, slug };
}

export async function updateProduct(productId: string, input: ProductInput) {
  const { admin } = await requireAdmin();

  if (input.variants.length === 0) {
    return {
      success: false,
      error: "Add at least one size/variant with a quantity in stock.",
    };
  }

  const problem = variantProblem(input);
  if (problem) return { success: false, error: problem };

  const totalStock = input.variants.reduce((sum, v) => sum + v.stock, 0);
  const status = resolveStatus(input.status, totalStock);
  const slug = await uniqueSlug(admin, input, productId);

  const { error } = await admin
    .from("products")
    .update({
      name: input.name,
      slug,
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
  revalidatePath(`/product/${slug}`);
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

export async function deleteProduct(
  productId: string,
  options: { force?: boolean } = {}
): Promise<{
  success: boolean;
  error?: string;
  /** Past orders or vendor sales exist: the product can only be hidden, not deleted. */
  hasHistory?: boolean;
  /** Vendors hold stock or a combo uses it: ask the admin before removing those too. */
  needsConfirmation?: boolean;
  message?: string;
}> {
  const { admin } = await requireAdmin();

  const [{ count: orderCount }, { count: saleCount }] = await Promise.all([
    admin.from("order_items").select("id", { count: "exact", head: true }).eq("product_id", productId),
    admin.from("vendor_sale_items").select("id", { count: "exact", head: true }).eq("product_id", productId),
  ]);

  if ((orderCount ?? 0) > 0 || (saleCount ?? 0) > 0) {
    return {
      success: false,
      hasHistory: true,
      error:
        "This product appears in past orders or vendor sales, so deleting it would break those records.",
    };
  }

  const [{ data: vendorStock }, { count: comboCount }] = await Promise.all([
    admin.from("vendor_inventory").select("vendor_id, available_quantity").eq("product_id", productId),
    admin.from("combo_items").select("id", { count: "exact", head: true }).eq("product_id", productId),
  ]);

  if (!options.force && ((vendorStock ?? []).length > 0 || (comboCount ?? 0) > 0)) {
    const vendors = new Set((vendorStock ?? []).map((v: any) => v.vendor_id)).size;
    const units = (vendorStock ?? []).reduce((sum: number, v: any) => sum + Number(v.available_quantity), 0);
    const bits: string[] = [];
    if (vendors > 0) bits.push(`${units} unit${units === 1 ? "" : "s"} assigned to ${vendors} vendor${vendors === 1 ? "" : "s"}`);
    if ((comboCount ?? 0) > 0) bits.push(`used in ${comboCount} combo${comboCount === 1 ? "" : "s"}`);
    return {
      success: false,
      needsConfirmation: true,
      message: `This product is ${bits.join(" and ")}. Deleting it will remove it from those vendors and combos too.`,
    };
  }

  // Clear everything that points at the product, then the product itself.
  await admin.from("combo_items").delete().eq("product_id", productId);
  await admin.from("inventory_movements").delete().eq("product_id", productId);
  await admin.from("vendor_inventory").delete().eq("product_id", productId);

  const { error } = await admin.from("products").delete().eq("id", productId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/admin/assistant");
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

/** Turns off the sale discount on one product (the discount tiers are left alone). */
export async function removeProductDiscount(productId: string) {
  const { admin } = await requireAdmin();
  const { error } = await admin
    .from("products")
    .update({ discount_type: null, discount_value: null })
    .eq("id", productId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
  return { success: true };
}

/** Turns off the sale discount on every product at once, and optionally the promo discount tiers too. */
export async function removeAllProductDiscounts(options: { alsoTiers?: boolean } = {}) {
  const { admin } = await requireAdmin();

  const { data: discounted, error: findError } = await admin
    .from("products")
    .select("id")
    .not("discount_type", "is", null);
  if (findError) return { success: false, error: findError.message, count: 0 };

  const ids = (discounted ?? []).map((p: any) => p.id);
  if (ids.length > 0) {
    const { error } = await admin
      .from("products")
      .update({ discount_type: null, discount_value: null })
      .in("id", ids);
    if (error) return { success: false, error: error.message, count: 0 };
  }

  let tiersRemoved = 0;
  if (options.alsoTiers) {
    const { count } = await admin
      .from("product_discount_tiers")
      .select("id", { count: "exact", head: true });
    tiersRemoved = count ?? 0;
    const { error } = await admin
      .from("product_discount_tiers")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) return { success: false, error: error.message, count: ids.length };
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
  return { success: true, count: ids.length, tiersRemoved };
}
