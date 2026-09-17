"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createCombo, toggleComboStatus, deleteCombo } from "@/lib/actions/admin-combos";

interface Product {
  id: string;
  name: string;
  product_variants: { id: string; size: string }[];
}

interface Combo {
  id: string;
  name: string;
  combo_price: number;
  status: "active" | "draft";
  combo_items: { id: string; quantity: number; products: { id: string; name: string } | null }[];
}

export function ComboManager({ combos, products }: { combos: Combo[]; products: Product[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [comboPrice, setComboPrice] = useState("");
  const [selectedItems, setSelectedItems] = useState<
    { productId: string; variantId: string | null; quantity: number }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function addItemRow() {
    if (products.length === 0) return;
    setSelectedItems((prev) => [
      ...prev,
      { productId: products[0].id, variantId: null, quantity: 1 },
    ]);
  }

  function updateItem(index: number, patch: Partial<(typeof selectedItems)[number]>) {
    setSelectedItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const result = await createCombo({
      name,
      description,
      image,
      comboPrice: Number(comboPrice),
      items: selectedItems,
    });

    setSaving(false);

    if (!result.success) {
      setError(result.error ?? "Could not create combo.");
      return;
    }

    setName("");
    setDescription("");
    setImage("");
    setComboPrice("");
    setSelectedItems([]);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleCreate} className="rounded-xl2 border border-espresso/10 bg-white/60 p-4 sm:p-6">
        <h2 className="mb-4 font-display text-lg text-espresso">Create a Combo</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-espresso">Combo Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. His & Hers Signature Duo"
              required
              className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-espresso">Combo Price (₦)</label>
            <input
              type="number"
              min={0}
              required
              value={comboPrice}
              onChange={(e) => setComboPrice(e.target.value)}
              className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-espresso">Image URL (optional)</label>
            <input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-espresso">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-espresso">Products in this combo (pick at least 2)</p>
          <div className="space-y-2">
            {selectedItems.map((item, i) => {
              const product = products.find((p) => p.id === item.productId);
              return (
                <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <select
                    value={item.productId}
                    onChange={(e) => updateItem(i, { productId: e.target.value, variantId: null })}
                    className="flex-1 rounded-lg border border-espresso/15 px-3 py-2 text-sm"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {product && product.product_variants.length > 0 && (
                    <select
                      value={item.variantId ?? ""}
                      onChange={(e) => updateItem(i, { variantId: e.target.value || null })}
                      className="rounded-lg border border-espresso/15 px-3 py-2 text-sm"
                    >
                      <option value="">Any size</option>
                      {product.product_variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.size}
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                    className="w-20 rounded-lg border border-espresso/15 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedItems((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={addItemRow}
            className="mt-2 text-xs text-caramel underline"
          >
            + Add product
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
        )}

        <Button type="submit" className="mt-4 w-full sm:w-auto" disabled={saving}>
          {saving ? "Creating…" : "Create Combo"}
        </Button>
      </form>

      <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-4 sm:p-6">
        <h2 className="mb-4 font-display text-lg text-espresso">All Combos</h2>
        <div className="space-y-2">
          {combos.length === 0 && <p className="text-sm text-rich/50">No combos yet.</p>}
          {combos.map((combo) => (
            <div
              key={combo.id}
              className="flex flex-col gap-2 rounded-xl border border-espresso/10 bg-cream/60 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-espresso">{combo.name}</p>
                <p className="text-xs text-rich/50">
                  ₦{Number(combo.combo_price).toLocaleString()} ·{" "}
                  {combo.combo_items.map((i) => i.products?.name).filter(Boolean).join(", ")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  onClick={async () => {
                    await toggleComboStatus(combo.id, combo.status === "active" ? "draft" : "active");
                    router.refresh();
                  }}
                  className={`rounded-full px-2.5 py-1 text-xs ${
                    combo.status === "active" ? "bg-green-100 text-green-700" : "bg-espresso/10 text-rich/50"
                  }`}
                >
                  {combo.status === "active" ? "Active" : "Draft"}
                </button>
                <button
                  onClick={async () => {
                    if (!confirm("Delete this combo?")) return;
                    await deleteCombo(combo.id);
                    router.refresh();
                  }}
                  className="text-xs text-red-500 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
