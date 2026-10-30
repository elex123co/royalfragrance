import { getCategories } from "@/lib/data/categories";
import { ProductForm } from "@/components/admin/ProductForm";

// Always fetch live data — admin dashboards must never serve a stale build-time snapshot.
export const dynamic = "force-dynamic";

export const metadata = { title: "New Product — Admin — Royal Fragrance" };

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div>
      <h1 className="mb-3 font-display text-2xl text-espresso">New Product</h1>
      <p className="mb-6 rounded-xl bg-caramel/10 px-4 py-3 text-sm text-espresso">
        Adding several perfumes? Drop their photos into the{" "}
        <a href="/admin/assistant" className="underline">
          Product Assistant
        </a>{" "}
        and it will read each carton and prepare the products for you.
      </p>
      <ProductForm categories={categories} />
    </div>
  );
}
