"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import {
  deleteProduct,
  updateProductStatus,
} from "@/lib/actions/admin-products";

export function ProductRowActions({
  productId,
  slug,
  status,
  name,
}: {
  productId: string;
  slug: string;
  name?: string;
  status: "active" | "draft" | "out_of_stock";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(next: "active" | "draft" | "out_of_stock") {
    startTransition(async () => {
      await updateProductStatus(productId, next);
      router.refresh();
    });
  }

  function handleDelete() {
    const label = name ? `"${name}"` : "this product";
    if (!confirm(`Delete ${label} permanently? This cannot be undone.`)) return;
    startTransition(async () => {
      let result = await deleteProduct(productId);

      if (result.needsConfirmation) {
        if (!confirm(`${result.message}\n\nDelete it anyway?`)) return;
        result = await deleteProduct(productId, { force: true });
      }

      if (result.hasHistory) {
        if (
          confirm(
            `${result.error}\n\nHide ${label} from the shop instead? It will be set to Draft and its records stay safe.`
          )
        ) {
          await updateProductStatus(productId, "draft");
          router.refresh();
        }
        return;
      }

      if (!result.success) {
        alert(result.error ?? "Could not delete this product.");
        return;
      }
      router.refresh();
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
        className="flex items-center gap-1 rounded-full border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
        aria-label="Delete"
      >
        <Trash2 size={13} /> Delete
      </button>
    </div>
  );
}
