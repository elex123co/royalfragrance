"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "./require-admin";
import {
  extractPackagingFacts,
  writeProductCopy,
  displayNameFrom,
  type PackagingFacts,
} from "@/lib/ai/product-copy";

const BUCKET = "product-images";
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

type Admin = Awaited<ReturnType<typeof requireAdmin>>["admin"];

// ---------- helpers ----------

function hamming(a: string, b: string) {
  if (a.length !== b.length) return 64;
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) {
      d += x & 1;
      x >>= 1;
    }
  }
  return d;
}

const STOP = new Set([
  "eau", "de", "du", "la", "le", "parfum", "toilette", "edp", "edt", "for", "men", "man", "women", "woman",
  "pour", "homme", "femme", "her", "him", "perfume", "fragrance", "spray", "cologne", "extrait", "ml", "by",
  "the", "and", "body", "mist", "oil", "attar", "unisex", "original", "new",
]);

function tokens(name: string) {
  return new Set(
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((t) => t && !STOP.has(t) && !/^\d+$/.test(t))
  );
}

function sameFragrance(a: string, b: string) {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return false;
  let inter = 0;
  ta.forEach((t) => tb.has(t) && inter++);
  const min = Math.min(ta.size, tb.size);
  const max = Math.max(ta.size, tb.size);
  return inter === min && max - min <= 1;
}

async function uniqueSlug(admin: Admin, name: string) {
  const base =
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "product";
  const { data } = await admin.from("products").select("slug").like("slug", `${base}%`);
  const taken = new Set((data ?? []).map((p: any) => p.slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

function refresh() {
  revalidatePath("/admin/assistant");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
}

// ---------- 1. add to gallery ----------

export async function addGalleryImage(
  formData: FormData
): Promise<{ success: boolean; id?: string; url?: string; skipped?: boolean; error?: string }> {
  const { admin } = await requireAdmin();
  const file = formData.get("file");
  const phash = String(formData.get("phash") ?? "");
  if (!(file instanceof File)) return { success: false, error: "No file provided" };
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Use a JPG, PNG, WEBP or AVIF image." };
  }
  if (file.size > MAX_SIZE_BYTES) return { success: false, error: "Image must be under 5MB." };

  // Skip a photo that is (near) identical to one already in the gallery.
  if (/^[0-9a-f]{16}$/.test(phash)) {
    const { data: existing } = await admin.from("product_gallery").select("id, phash").not("phash", "is", null).limit(3000);
    if ((existing ?? []).some((e: any) => e.phash && hamming(e.phash, phash) <= 4)) {
      return { success: true, skipped: true };
    }
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `gallery/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await admin.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (upErr) return { success: false, error: upErr.message };
  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);

  const { data: row, error } = await admin
    .from("product_gallery")
    .insert({ url: pub.publicUrl, phash: phash || null, status: "new" })
    .select("id, url")
    .single();
  if (error || !row) return { success: false, error: error?.message ?? "Could not save" };
  return { success: true, id: row.id, url: row.url };
}

// ---------- 2. read the packaging ----------

export async function extractGalleryItem(id: string): Promise<{ success: boolean; error?: string }> {
  const { admin } = await requireAdmin();
  const { data: item } = await admin.from("product_gallery").select("*").eq("id", id).maybeSingle();
  if (!item) return { success: false, error: "Photo not found." };

  try {
    const facts = await extractPackagingFacts([item.url]);
    if (facts.legibility === "unreadable" || (!facts.productName && !facts.brand)) {
      await admin
        .from("product_gallery")
        .update({
          status: "failed",
          ai_data: { facts },
          note: "I could not read a name on this photo. Try a clearer photo of the front of the box.",
        })
        .eq("id", id);
      return { success: false, error: "unreadable" };
    }
    await admin.from("product_gallery").update({ status: "extracted", ai_data: { facts }, note: null }).eq("id", id);
    return { success: true };
  } catch (e: any) {
    console.error("extractGalleryItem failed:", e);
    await admin
      .from("product_gallery")
      .update({
        status: "failed",
        note: `The AI could not read this photo. ${String(e?.message ?? "").slice(0, 600)}`.trim(),
      })
      .eq("id", id);
    return { success: false, error: e?.message ?? "failed" };
  }
}

// ---------- 3. check the shop, write the copy, create the draft ----------

export async function composeGalleryItem(
  id: string,
  options: { force?: boolean } = {}
): Promise<{ success: boolean; outcome?: "draft" | "duplicate" | "extra-photo"; error?: string }> {
  const { admin } = await requireAdmin();
  const { data: item } = await admin.from("product_gallery").select("*").eq("id", id).maybeSingle();
  const facts: PackagingFacts | undefined = item?.ai_data?.facts;
  if (!item || !facts) return { success: false, error: "Read the photo first." };

  const displayName = displayNameFrom(facts);
  if (!displayName) return { success: false, error: "No name found." };

  try {
    // Is this fragrance already in the shop (or already drafted from another photo)?
    if (!options.force) {
      const { data: all } = await admin.from("products").select("id, name, status");
      const match = (all ?? []).find((p: any) => sameFragrance(p.name, displayName));
      if (match) {
        const { count } = await admin
          .from("product_gallery")
          .select("id", { count: "exact", head: true })
          .eq("product_id", match.id)
          .in("status", ["ready"]);
        if (match.status === "draft" && (count ?? 0) > 0) {
          const { data: imgs } = await admin.from("product_images").select("position").eq("product_id", match.id);
          const nextPos = (imgs ?? []).reduce((m: number, i: any) => Math.max(m, i.position), -1) + 1;
          await admin.from("product_images").insert({ product_id: match.id, url: item.url, position: nextPos });
          await admin
            .from("product_gallery")
            .update({ status: "ready", product_id: match.id, note: `Extra photo added to the draft "${match.name}".` })
            .eq("id", id);
          refresh();
          return { success: true, outcome: "extra-photo" };
        }
        await admin
          .from("product_gallery")
          .update({ status: "duplicate", note: `Already in the shop as "${match.name}".` })
          .eq("id", id);
        refresh();
        return { success: true, outcome: "duplicate" };
      }
    }

    const { data: cats } = await admin.from("categories").select("id, name");
    const catList = cats ?? [];
    const copy = await writeProductCopy({
      facts,
      displayName,
      availableCategories: Array.from(new Set(catList.map((c: any) => c.name))),
    });
    const categoryId = catList.find((c: any) => c.name === copy.category)?.id ?? null;
    const slug = await uniqueSlug(admin, displayName);
    const hasNotes = copy.notes.top.length + copy.notes.heart.length + copy.notes.base.length > 0;

    const { data: product, error } = await admin
      .from("products")
      .insert({
        name: displayName,
        slug,
        description: copy.description,
        short_description: copy.caption,
        category_id: categoryId,
        base_price: 0,
        status: "draft",
        type: facts.concentration,
        fragrance_notes: hasNotes ? copy.notes : null,
      })
      .select("id")
      .single();
    if (error || !product) throw new Error(error?.message ?? "Could not create the draft");

    await admin.from("product_images").insert({ product_id: product.id, url: item.url, position: 0 });
    if (facts.volumesMl.length > 0) {
      await admin
        .from("product_variants")
        .insert(facts.volumesMl.map((n) => ({ product_id: product.id, size: `${n}ml`, price: 0, stock: 0 })));
    }

    await admin
      .from("product_gallery")
      .update({ status: "ready", product_id: product.id, ai_data: { facts, copy }, note: null })
      .eq("id", id);
    refresh();
    return { success: true, outcome: "draft" };
  } catch (e: any) {
    console.error("composeGalleryItem failed:", e);
    await admin
      .from("product_gallery")
      .update({ status: "failed", note: "I could not write this one right now. Try again." })
      .eq("id", id);
    return { success: false, error: e?.message ?? "failed" };
  }
}

// ---------- 4. review: save, publish, remove ----------

export interface DraftEdit {
  name: string;
  caption: string;
  description: string;
  categoryId: string | null;
  type: string;
  variants: { size: string; price: number; stock: number }[];
}

async function applyEdit(admin: Admin, productId: string, e: DraftEdit) {
  const variants = e.variants
    .map((v) => ({ size: v.size.trim(), price: Number(v.price) || 0, stock: Math.max(0, Math.floor(Number(v.stock) || 0)) }))
    .filter((v) => v.size);
  const { error } = await admin
    .from("products")
    .update({
      name: e.name.trim(),
      short_description: e.caption.trim(),
      description: e.description.trim(),
      category_id: e.categoryId || null,
      type: e.type.trim() || null,
      base_price: variants.length ? Math.min(...variants.map((v) => v.price)) : 0,
    })
    .eq("id", productId);
  if (error) throw new Error(error.message);
  await admin.from("product_variants").delete().eq("product_id", productId);
  if (variants.length) {
    const { error: vErr } = await admin
      .from("product_variants")
      .insert(variants.map((v) => ({ ...v, product_id: productId })));
    if (vErr) throw new Error(vErr.message);
  }
  return variants;
}

async function assertGalleryDraft(admin: Admin, productId: string) {
  const { data: p } = await admin.from("products").select("status").eq("id", productId).maybeSingle();
  const { count } = await admin
    .from("product_gallery")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);
  if (!p || p.status !== "draft" || !count) throw new Error("Only unpublished gallery drafts can be edited here.");
}

export async function saveGalleryDraft(productId: string, edit: DraftEdit): Promise<{ success: boolean; error?: string }> {
  const { admin } = await requireAdmin();
  try {
    await assertGalleryDraft(admin, productId);
    await applyEdit(admin, productId, edit);
    refresh();
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function publishGalleryDraft(productId: string, edit: DraftEdit): Promise<{ success: boolean; error?: string }> {
  const { admin } = await requireAdmin();
  try {
    await assertGalleryDraft(admin, productId);
    if (!edit.name.trim()) return { success: false, error: "Give the product a name." };
    if (!edit.description.trim()) return { success: false, error: "Add a description." };
    const variants = await applyEdit(admin, productId, edit);
    if (variants.length === 0) return { success: false, error: "Add at least one size." };
    if (variants.some((v) => v.price <= 0)) return { success: false, error: "Every size needs a price above zero." };

    const { error } = await admin.from("products").update({ status: "active" }).eq("id", productId);
    if (error) throw new Error(error.message);
    await admin.from("product_gallery").update({ status: "published", note: null }).eq("product_id", productId);
    refresh();
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/** Removes a photo from the gallery. A draft that only existed for it is deleted too. */
export async function removeGalleryItem(id: string): Promise<{ success: boolean; error?: string }> {
  const { admin } = await requireAdmin();
  const { data: item } = await admin.from("product_gallery").select("product_id, status").eq("id", id).maybeSingle();
  if (!item) return { success: true };
  if (item.status === "published") return { success: false, error: "Published products are managed under Products." };

  await admin.from("product_gallery").delete().eq("id", id);
  if (item.product_id) {
    const { count } = await admin
      .from("product_gallery")
      .select("id", { count: "exact", head: true })
      .eq("product_id", item.product_id);
    if (!count) {
      const { data: p } = await admin.from("products").select("status").eq("id", item.product_id).maybeSingle();
      if (p?.status === "draft") await admin.from("products").delete().eq("id", item.product_id);
    }
  }
  refresh();
  return { success: true };
}

/** Puts a failed or duplicate photo back in the queue. */
export async function requeueGalleryItem(id: string): Promise<{ success: boolean }> {
  const { admin } = await requireAdmin();
  await admin.from("product_gallery").update({ status: "new", note: null, ai_data: null }).eq("id", id).in("status", ["failed", "duplicate"]);
  refresh();
  return { success: true };
}

export async function fetchGallery() {
  await requireAdmin();
  const { getGalleryItems } = await import("@/lib/data/gallery");
  return getGalleryItems();
}

/** Throws away a draft and its gallery photos (only while it is still a draft). */
export async function discardGalleryDraft(productId: string): Promise<{ success: boolean; error?: string }> {
  const { admin } = await requireAdmin();
  try {
    await assertGalleryDraft(admin, productId);
    await admin.from("product_gallery").delete().eq("product_id", productId);
    await admin.from("products").delete().eq("id", productId);
    refresh();
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
