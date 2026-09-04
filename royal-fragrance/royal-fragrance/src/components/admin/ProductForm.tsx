"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  createProduct,
  updateProduct,
  type ProductInput,
} from "@/lib/actions/admin-products";

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
  const [form, setForm] = useState<ProductInput>({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    shortDescription: initial?.shortDescription ?? "",
    categoryId: initial?.categoryId ?? null,
    basePrice: initial?.basePrice ?? 0,
    status: initial?.status ?? "draft",
    imageUrl: initial?.imageUrl ?? "",
    variants: initial?.variants?.length
      ? initial.variants
      : [{ size: "50ml", price: 0, stock: 0 }],
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    setForm((f) => ({
      ...f,
      variants: f.variants.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Product Name"
          value={form.name}
          onChange={(v) => setForm((f) => ({ ...f, name: v }))}
        />
        <TextField
          label="Slug"
          value={form.slug}
          placeholder={slugify(form.name) || "auto-generated"}
          onChange={(v) => setForm((f) => ({ ...f, slug: v }))}
        />
      </div>

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
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      <TextField
        label="Base Price (₦, used if no variants)"
        type="number"
        value={String(form.basePrice)}
        onChange={(v) => setForm((f) => ({ ...f, basePrice: Number(v) || 0 }))}
      />

      <TextField
        label="Image URL"
        value={form.imageUrl}
        onChange={(v) => setForm((f) => ({ ...f, imageUrl: v }))}
      />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-espresso">Variants</label>
          <button
            type="button"
            onClick={addVariant}
            className="text-xs text-caramel underline"
          >
            + Add variant
          </button>
        </div>
        <div className="space-y-2">
          {form.variants.map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                placeholder="Size (e.g. 50ml)"
                value={v.size}
                onChange={(e) => updateVariant(i, { size: e.target.value })}
                className="flex-1 rounded-lg border border-espresso/15 px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Price"
                value={v.price}
                onChange={(e) => updateVariant(i, { price: Number(e.target.value) })}
                className="w-24 rounded-lg border border-espresso/15 px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Stock"
                value={v.stock}
                onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })}
                className="w-20 rounded-lg border border-espresso/15 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => removeVariant(i)}
                className="text-rich/40 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <Button type="submit" disabled={submitting}>
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
