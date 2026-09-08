import { getCurrentVendor } from "@/lib/data/vendor";
import { createAdminClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/utils/currency";

export const metadata = { title: "Earnings — Vendor — Royal Fragrance" };

export default async function VendorEarningsPage() {
  const vendor = await getCurrentVendor();
  const supabase = createAdminClient();

  const { data: commissions } = await supabase
    .from("vendor_commissions")
    .select("*")
    .eq("vendor_id", vendor!.user_id)
    .order("created_at", { ascending: false });

  const total = (commissions ?? []).reduce((sum, c) => sum + Number(c.amount), 0);
  const thisMonth = (commissions ?? [])
    .filter((c) => new Date(c.created_at).getMonth() === new Date().getMonth())
    .reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl text-espresso">My Earnings</h1>
      <p className="mb-6 text-sm text-rich/60">10% commission on every sale.</p>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-5">
          <p className="text-xs uppercase tracking-wide text-rich/50">Total Earned</p>
          <p className="mt-2 font-display text-2xl text-espresso">{formatNaira(total)}</p>
        </div>
        <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-5">
          <p className="text-xs uppercase tracking-wide text-rich/50">This Month</p>
          <p className="mt-2 font-display text-2xl text-espresso">{formatNaira(thisMonth)}</p>
        </div>
      </div>

      <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-6">
        <h2 className="mb-4 font-display text-lg text-espresso">History</h2>
        <div className="space-y-2">
          {(!commissions || commissions.length === 0) && (
            <p className="text-sm text-rich/50">No commissions earned yet.</p>
          )}
          {commissions?.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-xl border border-espresso/10 bg-cream/60 px-4 py-3 text-sm"
            >
              <div>
                <p className="text-espresso capitalize">
                  {c.source_type === "vendor_sale" ? "Recorded Sale" : "Referred Order"}
                </p>
                <p className="text-xs text-rich/50">
                  {new Date(c.created_at).toLocaleDateString()} · {Number(c.rate) * 100}% rate
                </p>
              </div>
              <span className="font-display text-espresso">{formatNaira(c.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
