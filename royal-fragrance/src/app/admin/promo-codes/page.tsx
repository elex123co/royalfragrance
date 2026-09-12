import { createAdminClient } from "@/lib/supabase/server";
import { PromoCodesPanel } from "@/components/admin/PromoCodesPanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Promo Codes — Admin — Royal Fragrance" };

export default async function AdminPromoCodesPage() {
  const supabase = createAdminClient();
  const { data: codes } = await supabase
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl text-espresso">Promo Codes</h1>
      <p className="mb-6 text-sm text-rich/60">
        Create discount codes customers can redeem at checkout.
      </p>
      <PromoCodesPanel codes={codes ?? []} />
    </div>
  );
}
