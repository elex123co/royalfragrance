"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  deleteProduct,
  updateProductStatus,
} from "@/lib/actions/admin-products";

export function ProductRowActions({
  productId,
  slug,
  status,
}: {
  productId: string;
  slug: string;
  status: "active" | "draft" | "out_of_stock";
}) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(next: "active" | "draft" | "out_of_stock") {
    startTransition(() => {
      updateProductStatus(productId, next);
    });
  }

  function handleDelete() {
    if (!confirm(`Delete this product? This cannot be undone.`)) return;
    startTransition(() => {
      deleteProduct(productId);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={status}
        disabled={isPending}
        onChange={(e) => handleStatusChange(e.target.value as any)}
        className="rounded-lg border border-espresso/15 bg-white px-2 py-1 text-xs"
      >
        <option value="active">Active</option>
        <option value="draft">Draft</option>
        <option value="out_of_stock">Out of Stock</option>
      </select>
      <Link
        href={`/admin/products/${productId}`}
        className="text-espresso/60 hover:text-espresso"
        aria-label="Edit"
      >
        <Pencil size={14} />
      </Link>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="text-espresso/60 hover:text-red-600"
        aria-label="Delete"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
