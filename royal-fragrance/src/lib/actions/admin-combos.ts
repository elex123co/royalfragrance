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

export interface CreateComboInput {
  name: string;
  description: string;
  image: string;
  comboPrice: number;
  items: { productId: string; variantId: string | null; quantity: number }[];
}

export async function createCombo(input: CreateComboInput) {
  const { admin } = await requireAdmin();

  if (input.items.length < 2) {
    return { success: false, error: "A combo needs at least 2 products." };
  }
  if (!input.comboPrice || input.comboPrice <= 0) {
    return { success: false, error: "Enter a combo price greater than 0." };
  }

  const { data: combo, error } = await admin
    .from("combos")
    .insert({
      name: input.name,
      slug: slugify(input.name),
      description: input.description || null,
      image: input.image || null,
      combo_price: input.comboPrice,
    })
    .select("id")
    .single();

  if (error || !combo) {
    return { success: false, error: error?.message ?? "Could not create combo." };
  }

  const { error: itemsError } = await admin.from("combo_items").insert(
    input.items.map((item) => ({
      combo_id: combo.id,
      product_id: item.productId,
      variant_id: item.variantId,
      quantity: item.quantity,
    }))
  );

  if (itemsError) {
    return { success: false, error: "Combo created, but items failed to save: " + itemsError.message };
  }

  revalidatePath("/admin/combos");
  revalidatePath("/combos");
  return { success: true };
}

export async function toggleComboStatus(comboId: string, status: "active" | "draft") {
  const { admin } = await requireAdmin();
  const { error } = await admin.from("combos").update({ status }).eq("id", comboId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/combos");
  revalidatePath("/combos");
  return { success: true };
}

export async function deleteCombo(comboId: string) {
  const { admin } = await requireAdmin();
  const { error } = await admin.from("combos").delete().eq("id", comboId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/combos");
  revalidatePath("/combos");
  return { success: true };
}
