"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
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
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [variantId, setVariantId] = useState(products[0]?.product_variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;
    // Keep the chosen product visible even if it no longer matches the search.
    const selected = products.find((p) => p.id === productId);
    return selected && !list.includes(selected) ? [selected, ...list] : list;
  }, [products, search, productId]);

  const selectedProduct = products.find((p) => p.id === productId);
  const hasVariants = (selectedProduct?.product_variants.length ?? 0) > 0;

  function chooseProduct(id: string) {
    setProductId(id);
    const p = products.find((x) => x.id === id);
    // A product with sizes must be assigned by size, so default to its first.
    setVariantId(p?.product_variants[0]?.id ?? "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      setStatus("error");
      setError("Enter how many to assign.");
      return;
    }
    setStatus("loading");
    setError(null);

    const result = await transferInventoryToVendor({
      vendorId,
      productId,
      variantId: hasVariants ? variantId : null,
      quantity: qty,
    });

    if (!result.success) {
      setStatus("error");
      setError(result.error ?? "Transfer failed");
      return;
    }
    setStatus("success");
    setQuantity("");
    router.refresh();
    setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-rich/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products"
          className="w-full rounded-lg border border-espresso/15 py-2 pl-9 pr-3 text-sm"
        />
      </div>

      <select
        value={productId}
        onChange={(e) => chooseProduct(e.target.value)}
        size={Math.min(Math.max(filtered.length, 2), 6)}
        className="w-full rounded-lg border border-espresso/15 px-3 py-2 text-sm"
      >
        {filtered.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      {search.trim() && filtered.length === 0 && (
        <p className="text-xs text-rich/50">No product matches that search.</p>
      )}

      {hasVariants && (
        <select
          value={variantId}
          onChange={(e) => setVariantId(e.target.value)}
          className="w-full rounded-lg border border-espresso/15 px-3 py-2 text-sm"
        >
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
        inputMode="numeric"
        placeholder="Quantity to assign"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        className="w-full rounded-lg border border-espresso/15 px-3 py-2 text-sm"
      />

      {error && <p className="text-xs text-red-600">{error}</p>}
      {status === "success" && <p className="text-xs text-green-600">Inventory transferred.</p>}

      <Button type="submit" size="sm" disabled={status === "loading" || !productId}>
        {status === "loading" ? "Transferring…" : "Transfer Stock"}
      </Button>
    </form>
  );
}
