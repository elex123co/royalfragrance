import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/utils/currency";
import { Plus } from "lucide-react";
import { ProductRowActions } from "@/components/admin/ProductRowActions";

// Always fetch live data — admin dashboards must never serve a stale build-time snapshot.
export const dynamic = "force-dynamic";

export const metadata = { title: "Products — Admin — Royal Fragrance" };

export default async function AdminProductsPage() {
  const supabase = createAdminClient();
  const { data: products } = await supabase
    .from("products")
    .select(
      "id, name, slug, base_price, status, categories(name), product_variants(stock), product_images(url, position)"
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-espresso">Products</h1>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 rounded-full bg-espresso px-4 py-2 text-sm text-cream hover:bg-rich"
        >
          <Plus size={16} /> New Product
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl2 border border-espresso/10 bg-white/60">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-espresso/10 text-xs uppercase tracking-wide text-rich/50">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(!products || products.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-rich/50">
                  No products yet. Create your first product.
                </td>
              </tr>
            )}
            {products?.map((p: any) => {
              const totalStock = (p.product_variants ?? []).reduce(
                (sum: number, v: any) => sum + v.stock,
                0
              );
              return (
                <tr key={p.id} className="border-b border-espresso/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-espresso">{p.name}</td>
                  <td className="px-4 py-3 text-rich/70">
                    {p.categories?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-rich/70">
                    {formatNaira(p.base_price)}
                  </td>
                  <td className="px-4 py-3 text-rich/70">{totalStock}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs capitalize ${
                        p.status === "active"
                          ? "bg-green-100 text-green-700"
                          : p.status === "draft"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {p.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ProductRowActions productId={p.id} slug={p.slug} status={p.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
