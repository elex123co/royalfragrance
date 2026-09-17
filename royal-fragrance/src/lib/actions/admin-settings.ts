"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "./require-admin";

export interface WhatsappSettingsInput {
  businessPhone: string;
  groupLink: string;
}

export async function updateWhatsappSettings(input: WhatsappSettingsInput) {
  const { admin } = await requireAdmin();

  const { error } = await admin
    .from("whatsapp_settings")
    .update({
      business_phone: input.businessPhone || null,
      group_link: input.groupLink || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/settings");
  revalidatePath("/order-confirmation");
  return { success: true };
}
