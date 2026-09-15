import { createAdminClient } from "@/lib/supabase/server";
import { PromoCodesPanel } from "@/components/admin/PromoCodesPanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Promo Codes — Admin — Royal Fragrance" };

export default async function AdminPromoCodesPage() {
  const supabase = createAdminClient();
  const [{ data: codes }, { data: products }, { data: links }] = await Promise.all([
    supabase.from("promo_codes").select("*").order("created_at", { ascending: false }),
    supabase.from("products").select("id, name").order("name"),
    supabase.from("promo_code_products").select("promo_code_id, product_id, products(name)"),
  ]);

  // Group linked product names per code so the panel can show them without
  // a separate query per row.
  const linksByCode: Record<string, { id: string; name: string }[]> = {};
  for (const link of links ?? []) {
    const name = (link as any).products?.name ?? "Unknown product";
    if (!linksByCode[link.promo_code_id]) linksByCode[link.promo_code_id] = [];
    linksByCode[link.promo_code_id].push({ id: link.product_id, name });
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl text-espresso">Promo Codes</h1>
      <p className="mb-6 text-sm text-rich/60">
        Create discount codes customers can redeem at checkout. Each code can
        be locked to specific products, or left open to apply storewide.
      </p>
      <PromoCodesPanel
        codes={codes ?? []}
        products={products ?? []}
        linksByCode={linksByCode}
      />
    </div>
  );
}
