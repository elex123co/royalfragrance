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
  productCount: number;
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);

    const result = await createCategory(name.trim());

    setSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Could not create category");
      return;
    }
    setName("");
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
      <form onSubmit={handleAdd} className="flex gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name (e.g. Niche Fragrances)"
          className="flex-1 rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
        />
        <Button type="submit" disabled={submitting || !name.trim()}>
          {submitting ? "Adding…" : "Add"}
        </Button>
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
        {categories.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between border-b border-espresso/5 px-5 py-3 text-sm last:border-0"
          >
            <div>
              <p className="text-espresso">{c.name}</p>
              <p className="text-xs text-rich/40">
                {c.productCount} product{c.productCount !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => handleDelete(c.id)}
              className="text-rich/40 hover:text-red-600"
              aria-label="Delete category"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
