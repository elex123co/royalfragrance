import { getCurrentVendor, getVendorDashboardData } from "@/lib/data/vendor";
import { CopyAccountButton } from "@/components/vendor/CopyAccountButton";
import { BvnNinForm } from "@/components/vendor/BvnNinForm";
import { getT } from "@/lib/content/server";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const _t = await getT();
  return { title: _t("meta.vendor.collectionaccount.title", "Collection Account — Vendor — Royal Fragrance") 
  };
}

export default async function CollectionAccountPage() { const _t = await getT();
  const t = await getT();
  const vendor = await getCurrentVendor();
  const { collectionAccount } = await getVendorDashboardData(vendor!.user_id);
  const hasBvnOrNin = !!(vendor as any)?.bvn || !!(vendor as any)?.nin;

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-espresso">{_t("vendor.collectionaccount.dece31", "My Collection Account")}</h1>

      {!collectionAccount && !hasBvnOrNin ? (
        <BvnNinForm />
      ) : !collectionAccount ? (
        <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-6 text-sm text-rich/70">{_t("vendor.collectionaccount.54bda5", "Your BVN/NIN is on file — your collection account is now set up by the Royal Fragrance team. Check back soon or reach out to support if it's been a while.")}</div>
      ) : (
        <div className="max-w-md rounded-xl2 border border-espresso/10 bg-brand-gradient p-8 text-cream shadow-premium">
          <p className="text-xs uppercase tracking-widest text-sand">{_t("vendor.collectionaccount.429702", "Collection Account")}</p>

          <div className="mt-6 space-y-4">
            <div>
              <p className="text-xs text-cream/50">{_t("vendor.collectionaccount.9e8998", "Bank")}</p>
              <p className="text-lg">{collectionAccount.bank_name}</p>
            </div>
            <div>
              <p className="text-xs text-cream/50">{_t("vendor.collectionaccount.0bd62e", "Account Number")}</p>
              <p className="font-display text-2xl tracking-wider">
                {collectionAccount.account_number}
              </p>
            </div>
            <div>
              <p className="text-xs text-cream/50">{_t("vendor.collectionaccount.db3b79", "Account Name")}</p>
              <p className="text-lg">{collectionAccount.account_name}</p>
            </div>
          </div>

          <CopyAccountButton
            accountNumber={collectionAccount.account_number}
            bankName={collectionAccount.bank_name}
            accountName={collectionAccount.account_name}
          />

          <p className="mt-6 text-xs text-cream/50">
            {t("vendor.account.note")}
          </p>
        </div>
      )}
    </div>
  );
}
