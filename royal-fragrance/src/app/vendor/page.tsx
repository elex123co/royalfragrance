import Link from "next/link";
import { getCurrentVendor, getVendorDashboardData } from "@/lib/data/vendor";
import { createAdminClient } from "@/lib/supabase/server";
import { formatNaira } from "@/lib/utils/currency";
import { getT, type TFn } from "@/lib/content/server";

export const metadata = { title: "Vendor Overview — Royal Fragrance" };

export default async function VendorOverviewPage() {
  const t = await getT();
  const vendor = await getCurrentVendor();

  if (vendor!.vendor_type === "affiliate") {
    return <AffiliateOverview vendorId={vendor!.user_id} businessName={vendor!.business_name} t={t} />;
  }

  const data = await getVendorDashboardData(vendor!.user_id);
  const supabase = createAdminClient();
  const { data: commissions } = await supabase
    .from("vendor_commissions")
    .select("amount")
    .eq("vendor_id", vendor!.user_id);

  const today = new Date().toDateString();
  const receivedToday = data.transactions
    .filter((t: any) => new Date(t.transaction_date).toDateString() === today)
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  const totalReceived = data.transactions.reduce(
    (sum: number, t: any) => sum + Number(t.amount),
    0
  );

  // What the vendor has actually earned: their commission on recorded sales.
  const totalEarned = (commissions ?? []).reduce(
    (sum, c) => sum + Number(c.amount),
    0
  );

  const pendingHandovers = data.sales.filter(
    (s: any) => s.fulfillment_status === "pending_handover"
  ).length;

  // Goods at Hand: stock currently held by the vendor, valued at selling price.
  const goodsUnits = data.inventory.reduce(
    (sum: number, i: any) => sum + i.available_quantity,
    0
  );
  const goodsValue = data.inventory.reduce((sum: number, i: any) => {
    const unitPrice = Number(i.product_variants?.price ?? i.products?.base_price ?? 0);
    return sum + unitPrice * i.available_quantity;
  }, 0);

  const cards: { label: string; value: string | number; hint: string; href?: string }[] = [
    {
      label: t("vendor.home.earnings.label"),
      value: formatNaira(totalEarned),
      hint: t("vendor.home.earnings.hint"),
      href: "/vendor/earnings",
    },
    {
      label: t("vendor.home.goods.label"),
      value: formatNaira(goodsValue),
      hint: `${goodsUnits} unit${goodsUnits === 1 ? "" : "s"} of stock with you now, valued at selling price.`,
      href: "/vendor/inventory",
    },
    {
      label: t("vendor.home.received.label"),
      value: formatNaira(totalReceived),
      hint: t("vendor.home.received.hint"),
      href: "/vendor/transactions",
    },
    {
      label: t("vendor.home.today.label"),
      value: formatNaira(receivedToday),
      hint: t("vendor.home.today.hint"),
    },
    {
      label: t("vendor.home.pending.label"),
      value: data.unrecordedTransactions.length,
      hint: t("vendor.home.pending.hint"),
      href: "/vendor/transactions",
    },
    {
      label: t("vendor.home.deliver.label"),
      value: pendingHandovers,
      hint: t("vendor.home.deliver.hint"),
      href: "/vendor/handovers",
    },
  ];

  return (
    <div>
      <h1 className="mb-8 font-display text-2xl text-espresso">
        {t("vendor.home.welcome", { name: vendor?.business_name ?? "" })}
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const body = (
            <>
              <p className="text-xs uppercase tracking-wide text-rich/50">
                {c.label}
              </p>
              <p className="mt-2 font-display text-2xl text-espresso">
                {c.value}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-rich/60">{c.hint}</p>
            </>
          );
          const cls = "rounded-xl2 border border-espresso/10 bg-white/60 p-5";
          return c.href ? (
            <Link key={c.label} href={c.href} className={`${cls} transition hover:border-caramel/50`}>
              {body}
            </Link>
          ) : (
            <div key={c.label} className={cls}>
              {body}
            </div>
          );
        })}
      </div>

      {data.unrecordedTransactions.length > 0 && (
        <div className="mt-8 rounded-xl2 border border-caramel/30 bg-caramel/10 p-5">
          <p className="text-sm text-espresso">
            You have {data.unrecordedTransactions.length} confirmed payment
            {data.unrecordedTransactions.length > 1 ? "s" : ""} waiting to be
            matched to a sale.{" "}
            <a href="/vendor/transactions" className="underline">
              {t("vendor.home.record")}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

async function AffiliateOverview({
  vendorId,
  businessName,
  t,
}: {
  vendorId: string;
  businessName: string;
  t: TFn;
}) {
  const supabase = createAdminClient();

  const [{ data: commissions }, { data: referredOrders }] = await Promise.all([
    supabase.from("vendor_commissions").select("amount").eq("vendor_id", vendorId),
    supabase
      .from("orders")
      .select("id, payment_status")
      .eq("referred_by_vendor_id", vendorId),
  ]);

  const totalEarnings = (commissions ?? []).reduce((sum, c) => sum + Number(c.amount), 0);
  const paidOrders = (referredOrders ?? []).filter((o) => o.payment_status === "paid").length;

  const cards = [
    { label: "Total Earnings", value: formatNaira(totalEarnings) },
    { label: "Referred Orders", value: paidOrders },
  ];

  return (
    <div>
      <h1 className="mb-8 font-display text-2xl text-espresso">
        {t("vendor.home.welcome", { name: businessName })}
      </h1>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl2 border border-espresso/10 bg-white/60 p-5">
            <p className="text-xs uppercase tracking-wide text-rich/50">{c.label}</p>
            <p className="mt-2 font-display text-2xl text-espresso">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl2 border border-caramel/30 bg-caramel/10 p-5">
        <p className="text-sm text-espresso">
          {t("vendor.aff.share")}{" "}
          <Link href="/vendor/links" className="underline">
            {t("vendor.aff.link")}
          </Link>
        </p>
      </div>
    </div>
  );
}
