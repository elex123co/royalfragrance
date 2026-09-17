import { createAdminClient } from "@/lib/supabase/server";
import { ComboManager } from "@/components/admin/ComboManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Combos — Admin — Royal Fragrance" };

export default async function AdminCombosPage() {
  const supabase = createAdminClient();
  const [{ data: combos }, { data: products }] = await Promise.all([
    supabase
      .from("combos")
      .select("*, combo_items(id, quantity, products(id, name))")
      .order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select("id, name, product_variants(id, size)")
      .order("name"),
  ]);

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl text-espresso">Combos</h1>
      <p className="mb-6 text-sm text-rich/60">
        Bundle several products together at one shared price.
      </p>
      <ComboManager combos={combos ?? []} products={products ?? []} />
    </div>
  );
}
