"use server";

import { requireAdmin } from "./require-admin";

const BUCKET = "product-images";
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Uploads a single product image file to Supabase Storage and returns its
 * public URL. Runs server-side with the service-role client, so the
 * storage bucket itself can stay locked down to admin-only writes.
 */
export async function uploadProductImage(formData: FormData): Promise<UploadResult> {
  const { admin } = await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "No file provided" };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      success: false,
      error: "Please upload a JPG, PNG, WEBP, or AVIF image.",
    };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return { success: false, error: "Image must be under 5MB." };
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);

  return { success: true, url: data.publicUrl };
}
