import { createAdminClient } from "@/lib/supabase/server";
import { PromoCodesPanel } from "@/components/admin/PromoCodesPanel";
import { NewUserDiscountPanel } from "@/components/admin/NewUserDiscountPanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Promo Codes — Admin — Royal Fragrance" };

export default async function AdminPromoCodesPage() {
  const supabase = createAdminClient();
  const [{ data: codes }, { data: newUserSettings }] = await Promise.all([
    supabase.from("promo_codes").select("*").order("created_at", { ascending: false }),
    supabase.from("new_user_discount_settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-1 font-display text-2xl text-espresso">Promo Codes</h1>
        <p className="text-sm text-rich/60">
          Create discount codes customers can redeem at checkout. Each code
          automatically works on any product that carries a matching discount
          tier — set tiers per product from the product's own edit page.
        </p>
      </div>

      <NewUserDiscountPanel settings={newUserSettings} />

      <PromoCodesPanel codes={codes ?? []} />
    </div>
  );
}
