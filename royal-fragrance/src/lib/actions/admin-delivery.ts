"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "./require-admin";

export async function updateDeliveryFee(zoneId: string, fee: number) {
  const { admin } = await requireAdmin();
  const { error } = await admin
    .from("delivery_zones")
    .update({ fee })
    .eq("id", zoneId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/delivery-fees");
  revalidatePath("/checkout");
  return { success: true };
}

export async function toggleDeliveryZoneActive(zoneId: string, active: boolean) {
  const { admin } = await requireAdmin();
  const { error } = await admin
    .from("delivery_zones")
    .update({ active })
    .eq("id", zoneId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/delivery-fees");
  revalidatePath("/checkout");
  return { success: true };
}
