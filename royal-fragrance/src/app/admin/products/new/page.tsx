import { getCategories } from "@/lib/data/categories";
import { ProductForm } from "@/components/admin/ProductForm";

// Always fetch live data — admin dashboards must never serve a stale build-time snapshot.
export const dynamic = "force-dynamic";

export const metadata = { title: "New Product — Admin — Royal Fragrance" };

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-espresso">New Product</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
