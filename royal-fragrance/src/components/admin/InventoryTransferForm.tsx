"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { transferInventoryToVendor } from "@/lib/actions/admin-inventory";

interface Product {
  id: string;
  name: string;
  product_variants: { id: string; size: string }[];
}

export function InventoryTransferForm({
  vendorId,
  products,
}: {
  vendorId: string;
  products: Product[];
}) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === productId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const result = await transferInventoryToVendor({
      vendorId,
      productId,
      variantId: variantId || null,
      quantity,
    });

    if (!result.success) {
      setStatus("error");
      setError(result.error ?? "Transfer failed");
      return;
    }
    setStatus("success");
    setQuantity(1);
    setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <select
        value={productId}
        onChange={(e) => {
          setProductId(e.target.value);
          setVariantId("");
        }}
        className="w-full rounded-lg border border-espresso/15 px-3 py-2 text-sm"
      >
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {(selectedProduct?.product_variants.length ?? 0) > 0 && (
        <select
          value={variantId}
          onChange={(e) => setVariantId(e.target.value)}
          className="w-full rounded-lg border border-espresso/15 px-3 py-2 text-sm"
        >
          <option value="">No specific variant</option>
          {selectedProduct!.product_variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.size}
            </option>
          ))}
        </select>
      )}

      <input
        type="number"
        min={1}
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        className="w-full rounded-lg border border-espresso/15 px-3 py-2 text-sm"
      />

      {error && <p className="text-xs text-red-600">{error}</p>}
      {status === "success" && (
        <p className="text-xs text-green-600">Inventory transferred.</p>
      )}

      <Button type="submit" size="sm" disabled={status === "loading" || !productId}>
        {status === "loading" ? "Transferring…" : "Transfer Stock"}
      </Button>
    </form>
  );
}
