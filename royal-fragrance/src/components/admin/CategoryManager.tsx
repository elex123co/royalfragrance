"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createCategory, deleteCategory } from "@/lib/actions/admin-categories";
import { Trash2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  parentCategoryId: string | null;
  productCount: number;
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topLevelCategories = categories.filter((c) => !c.parentCategoryId);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);

    const result = await createCategory(name.trim(), parentCategoryId || null);

    setSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Could not create category");
      return;
    }
    setName("");
    setParentCategoryId("");
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    const result = await deleteCategory(id);
    if (!result.success) {
      alert(result.error ?? "Could not delete category");
      return;
    }
    router.refresh();
  }

  return (
    <div className="max-w-xl space-y-6">
      <form onSubmit={handleAdd} className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name (e.g. Niche Fragrances)"
          className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
        />
        <div className="flex gap-3">
          <select
            value={parentCategoryId}
            onChange={(e) => setParentCategoryId(e.target.value)}
            className="flex-1 rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
          >
            <option value="">No parent — top-level category</option>
            {topLevelCategories.map((c) => (
              <option key={c.id} value={c.id}>
                Subcategory of "{c.name}"
              </option>
            ))}
          </select>
          <Button type="submit" disabled={submitting || !name.trim()}>
            {submitting ? "Adding…" : "Add"}
          </Button>
        </div>
      </form>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="rounded-xl2 border border-espresso/10 bg-white/60">
        {categories.length === 0 && (
          <p className="p-5 text-sm text-rich/50">No categories yet.</p>
        )}
        {topLevelCategories.map((parent) => {
          const children = categories.filter((c) => c.parentCategoryId === parent.id);
          return (
            <div key={parent.id} className="border-b border-espresso/5 last:border-0">
              <div className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="text-espresso">{parent.name}</p>
                  <p className="text-xs text-rich/40">
                    {parent.productCount} product{parent.productCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(parent.id)}
                  className="text-rich/40 hover:text-red-600"
                  aria-label="Delete category"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {children.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center justify-between border-t border-espresso/5 py-3 pl-10 pr-5 text-sm"
                >
                  <div>
                    <p className="text-rich/80">↳ {child.name}</p>
                    <p className="text-xs text-rich/40">
                      {child.productCount} product{child.productCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(child.id)}
                    className="text-rich/40 hover:text-red-600"
                    aria-label="Delete subcategory"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
