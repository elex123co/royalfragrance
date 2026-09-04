import { createAdminClient } from "@/lib/supabase/server";
import { CategoryManager } from "@/components/admin/CategoryManager";

// Always fetch live data — admin dashboards must never serve a stale build-time snapshot.
export const dynamic = "force-dynamic";

export const metadata = { title: "Categories — Admin — Royal Fragrance" };

export default async function AdminCategoriesPage() {
  const supabase = createAdminClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, products(count)")
    .order("name");

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-espresso">Categories</h1>
      <CategoryManager
        categories={(categories ?? []).map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          productCount: c.products?.[0]?.count ?? 0,
        }))}
      />
    </div>
  );
}
