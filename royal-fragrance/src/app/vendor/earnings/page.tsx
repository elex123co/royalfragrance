import { getCurrentVendor } from "@/lib/data/vendor";
import { createAdminClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/utils/currency";
import { getT } from "@/lib/content/server";

export async function generateMetadata() {
  const _t = await getT();
  return { title: _t("meta.vendor.earnings.title", "Earnings — Vendor — Royal Fragrance") 
  };
}

export default async function VendorEarningsPage() { const _t = await getT();
  const vendor = await getCurrentVendor();
  const supabase = createAdminClient();

  const { data: commissions } = await supabase
    .from("vendor_commissions")
    .select("*")
    .eq("vendor_id", vendor!.user_id)
    .order("created_at", { ascending: false });

  const total = (commissions ?? []).reduce((sum, c) => sum + Number(c.amount), 0);
  const thisMonth = (commissions ?? [])
    .filter((c) => {
      const d = new Date(c.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl text-espresso">{_t("vendor.earnings.aaf54a", "My Earnings")}</h1>
      <p className="mb-6 text-sm text-rich/60">{_t("vendor.earnings.20e813", "12% commission on every sale.")}</p>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-5">
          <p className="text-xs uppercase tracking-wide text-rich/50">{_t("vendor.earnings.ce51b5", "Total Earned")}</p>
          <p className="mt-2 font-display text-2xl text-espresso">{formatNaira(total)}</p>
        </div>
        <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-5">
          <p className="text-xs uppercase tracking-wide text-rich/50">{_t("vendor.earnings.0f6cc3", "This Month")}</p>
          <p className="mt-2 font-display text-2xl text-espresso">{formatNaira(thisMonth)}</p>
        </div>
      </div>

      <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-6">
        <h2 className="mb-4 font-display text-lg text-espresso">{_t("vendor.earnings.90ccd6", "History")}</h2>
        <div className="space-y-2">
          {(!commissions || commissions.length === 0) && (
            <p className="text-sm text-rich/50">{_t("vendor.earnings.a1517f", "No commissions earned yet.")}</p>
          )}
          {commissions?.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-xl border border-espresso/10 bg-cream/60 px-4 py-3 text-sm"
            >
              <div>
                <p className="text-espresso capitalize">
                  {c.source_type === "vendor_sale" ? _t("vendor.earnings.7395ce", "Recorded Sale") : _t("vendor.earnings.7833d9", "Referred Order")}
                </p>
                <p className="text-xs text-rich/50">
                  {_t("vendor.earnings.6cc0e4", "{v} · {v2}% rate", { v: new Date(c.created_at).toLocaleDateString(), v2: Number(c.rate) * 100 })}</p>
              </div>
              <span className="font-display text-espresso">{formatNaira(c.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
