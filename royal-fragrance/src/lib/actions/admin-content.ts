"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "./require-admin";
import { CONTENT_DEFAULTS } from "@/lib/content/registry";

/**
 * Saves edited wording. A value that is blank or identical to the original
 * removes the edit, so the site goes back to its original text.
 */
export async function saveSiteContent(entries: Record<string, string>) {
  const { admin } = await requireAdmin();

  const upserts: { key: string; value: string; updated_at: string }[] = [];
  const removals: string[] = [];
  for (const [key, raw] of Object.entries(entries)) {
    if (!(key in CONTENT_DEFAULTS)) continue;
    const value = raw.trim();
    if (value === "" || value === CONTENT_DEFAULTS[key]) removals.push(key);
    else upserts.push({ key, value, updated_at: new Date().toISOString() });
  }

  if (upserts.length) {
    const { error } = await admin.from("site_content").upsert(upserts, { onConflict: "key" });
    if (error) {
      return {
        success: false,
        error: error.message.includes("site_content")
          ? "The site_content table is missing. Run the SQL from the patch in Supabase first."
          : error.message,
      };
    }
  }
  if (removals.length) {
    const { error } = await admin.from("site_content").delete().in("key", removals);
    if (error && !error.message.includes("site_content")) return { success: false, error: error.message };
  }

  revalidateTag("site-content");
  revalidatePath("/", "layout");
  return { success: true, saved: upserts.length, reset: removals.length };
}
