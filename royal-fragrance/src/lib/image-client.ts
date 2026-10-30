/** Browser-only helpers for photo uploads. */

/** Downsizes a photo to at most 1600px and re-encodes it, so uploads are quick. */
export async function compressImage(file: File): Promise<File> {
  try {
    if (!file.type.startsWith("image/") || file.size < 300 * 1024) return file;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/webp", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return file;
  }
}

/** 64-bit difference hash of a photo, as 16 hex characters. Near-identical photos get near-identical hashes. */
export async function photoHash(file: File): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = 9;
    canvas.height = 8;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.drawImage(bitmap, 0, 0, 9, 8);
    const px = ctx.getImageData(0, 0, 9, 8).data;
    const gray = (x: number, y: number) => {
      const i = (y * 9 + x) * 4;
      return px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114;
    };
    let hex = "";
    for (let y = 0; y < 8; y++) {
      let nibble = 0;
      for (let x = 0; x < 8; x++) {
        nibble = (nibble << 1) | (gray(x, y) > gray(x + 1, y) ? 1 : 0);
        if (x % 4 === 3) {
          hex += nibble.toString(16);
          nibble = 0;
        }
      }
    }
    return hex;
  } catch {
    return "";
  }
}
