"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "./require-admin";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createCategory(name: string) {
  const { admin } = await requireAdmin();

  const { error } = await admin
    .from("categories")
    .insert({ name, slug: slugify(name) });

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/categories");
  revalidatePath("/shop");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const { admin } = await requireAdmin();

  const { error } = await admin.from("categories").delete().eq("id", id);

  if (error) {
    // Most likely a product still references this category (FK constraint).
    return {
      success: false,
      error: "Could not delete — some products are still using this category.",
    };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/shop");
  return { success: true };
}
