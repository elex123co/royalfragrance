import { createAdminClient } from "@/lib/supabase/server";

// Brand's personal WhatsApp line (also shown in the footer). Used as a
// fallback when the admin hasn't saved a business number in settings.
const FALLBACK_PHONE = "07040218594";

/** Converts a local Nigerian number (0704...) or any input to wa.me digits. */
function toWaDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) return `234${digits.slice(1)}`;
  return digits;
}

export async function getBrandWhatsAppLink(message?: string): Promise<string> {
  let phone: string | null = null;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("whatsapp_settings")
      .select("business_phone")
      .eq("id", 1)
      .maybeSingle();
    phone = data?.business_phone ?? null;
  } catch {
    phone = null;
  }
  const digits = toWaDigits(phone || FALLBACK_PHONE);
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}
