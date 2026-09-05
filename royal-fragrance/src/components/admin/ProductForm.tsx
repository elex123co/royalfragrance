"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  createProduct,
  updateProduct,
  type ProductInput,
} from "@/lib/actions/admin-products";
import { uploadProductImage } from "@/lib/actions/admin-upload";

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  categories: Category[];
  productId?: string;
  initial?: Partial<ProductInput>;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function ProductForm({ categories, productId, initial }: ProductFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ProductInput>({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    shortDescription: initial?.shortDescription ?? "",
    categoryId: initial?.categoryId ?? null,
    basePrice: initial?.basePrice ?? 0,
    status: initial?.status ?? "draft",
    images: initial?.images ?? [],
    variants: initial?.variants?.length
      ? initial.variants
      : [{ size: "50ml", price: 0, stock: 0 }],
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const totalStock = form.variants.reduce((sum, v) => sum + v.stock, 0);

  function updateVariant(index: number, patch: Partial<ProductInput["variants"][0]>) {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    }));
  }

  function addVariant() {
    setForm((f) => ({
      ...f,
      variants: [...f.variants, { size: "", price: 0, stock: 0 }],
    }));
  }

  function removeVariant(index: number) {
    if (form.variants.length <= 1) return; // always keep at least one
    setForm((f) => ({
      ...f,
      variants: f.variants.filter((_, i) => i !== index),
    }));
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);

    for (const file of Array.from(files)) {
      const data = new FormData();
      data.append("file", file);
      const result = await uploadProductImage(data);

      if (!result.success || !result.url) {
        setUploadError(result.error ?? `Could not upload ${file.name}`);
        continue;
      }
      setForm((f) => ({ ...f, images: [...f.images, result.url!] }));
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(index: number) {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.variants.some((v) => !v.size.trim())) {
      setError("Every size/variant needs a name (e.g. \"50ml\" or \"One Size\").");
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = { ...form, slug: form.slug || slugify(form.name) };
    const result = productId
      ? await updateProduct(productId, payload)
      : await createProduct(payload);

    setSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Something went wrong.");
      return;
    }

    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl space-y-5 rounded-xl2 border border-espresso/10 bg-white/60 p-6"
    >
      <TextField
        label="Product Name"
        value={form.name}
        onChange={(v) => setForm((f) => ({ ...f, name: v }))}
      />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-espresso">
          Short Description
        </label>
        <input
          value={form.shortDescription}
          onChange={(e) =>
            setForm((f) => ({ ...f, shortDescription: e.target.value }))
          }
          className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-espresso">
          Description
        </label>
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-espresso">
            Category
          </label>
          <select
            value={form.categoryId ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, categoryId: e.target.value || null }))
            }
            className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {categories.length === 0 && (
            <p className="mt-1 text-xs text-rich/50">
              No categories yet —{" "}
              <a href="/admin/categories" className="text-caramel underline">
                add one first
              </a>
              .
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-espresso">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({ ...f, status: e.target.value as any }))
            }
            className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
          >
            <option value="draft">Draft (hidden from shop)</option>
            <option value="active">Active</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
          <p className="mt-1 text-xs text-rich/50">
            Active/Out of Stock are kept in sync with total stock ({totalStock}{" "}
            available) automatically — this is just your intent when stock is 0.
          </p>
        </div>
      </div>

      <TextField
        label="Price (₦)"
        type="number"
        value={String(form.basePrice)}
        onChange={(v) => setForm((f) => ({ ...f, basePrice: Number(v) || 0 }))}
      />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-espresso">
          Product Photos
        </label>

        {form.images.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-3">
            {form.images.map((url, i) => (
              <div
                key={url + i}
                className="relative h-20 w-20 overflow-hidden rounded-lg border border-espresso/10"
              >
                <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-espresso/80 text-cream"
                  aria-label="Remove image"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="product-photo-upload"
        />
        <label
          htmlFor="product-photo-upload"
          className="flex w-fit cursor-pointer items-center gap-2 rounded-full border border-espresso/20 px-4 py-2 text-sm text-espresso transition hover:border-espresso"
        >
          <Upload size={14} />
          {uploading ? "Uploading…" : "Upload Photos"}
        </label>
        <p className="mt-1 text-xs text-rich/50">
          JPG, PNG, WEBP, or AVIF — up to 5MB each. First photo is the main image.
        </p>
        {uploadError && (
          <p className="mt-1 text-xs text-red-600">{uploadError}</p>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-espresso">
            Sizes &amp; Stock
          </label>
          <button
            type="button"
            onClick={addVariant}
            className="text-xs text-caramel underline"
          >
            + Add size
          </button>
        </div>
        <p className="mb-2 text-xs text-rich/50">
          No real size options? Just use one row labeled &ldquo;One Size&rdquo;
          with your total quantity in Stock.
        </p>
        <div className="space-y-3">
          {form.variants.map((v, i) => (
            <div
              key={i}
              className="relative rounded-lg border border-espresso/15 p-3 pr-9"
            >
              <button
                type="button"
                onClick={() => removeVariant(i)}
                disabled={form.variants.length <= 1}
                className="absolute right-2 top-2 text-rich/40 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Remove size"
              >
                ✕
              </button>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wide text-rich/50">
                    Size
                  </label>
                  <input
                    placeholder="50ml"
                    value={v.size}
                    onChange={(e) => updateVariant(i, { size: e.target.value })}
                    className="w-full rounded-lg border border-espresso/15 px-2 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wide text-rich/50">
                    Price (₦)
                  </label>
                  <input
                    type="number"
                    value={v.price}
                    onChange={(e) => updateVariant(i, { price: Number(e.target.value) })}
                    className="w-full rounded-lg border border-espresso/15 px-2 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-wide text-rich/50">
                    Stock
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={v.stock}
                    onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })}
                    className="w-full rounded-lg border border-espresso/15 px-2 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <Button type="submit" disabled={submitting || uploading}>
        {submitting ? "Saving…" : productId ? "Save Changes" : "Create Product"}
      </Button>
    </form>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-espresso">
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
      />
    </div>
  );
}
