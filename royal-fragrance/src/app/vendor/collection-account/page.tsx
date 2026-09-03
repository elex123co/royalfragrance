import { getCurrentVendor, getVendorDashboardData } from "@/lib/data/vendor";
import { CopyAccountButton } from "@/components/vendor/CopyAccountButton";

export const metadata = { title: "Collection Account — Vendor — Royal Fragrance" };

export default async function CollectionAccountPage() {
  const vendor = await getCurrentVendor();
  const { collectionAccount } = await getVendorDashboardData(vendor!.user_id);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-espresso">
        My Collection Account
      </h1>

      {!collectionAccount ? (
        <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-6 text-sm text-rich/70">
          Your collection account hasn&rsquo;t been set up yet. This is
          configured by the Royal Fragrance team once your vendor account is
          active — check back soon or reach out to support.
        </div>
      ) : (
        <div className="max-w-md rounded-xl2 border border-espresso/10 bg-brand-gradient p-8 text-cream shadow-premium">
          <p className="text-xs uppercase tracking-widest text-sand">
            Collection Account
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <p className="text-xs text-cream/50">Bank</p>
              <p className="text-lg">{collectionAccount.bank_name}</p>
            </div>
            <div>
              <p className="text-xs text-cream/50">Account Number</p>
              <p className="font-display text-2xl tracking-wider">
                {collectionAccount.account_number}
              </p>
            </div>
            <div>
              <p className="text-xs text-cream/50">Account Name</p>
              <p className="text-lg">{collectionAccount.account_name}</p>
            </div>
          </div>

          <CopyAccountButton
            accountNumber={collectionAccount.account_number}
            bankName={collectionAccount.bank_name}
            accountName={collectionAccount.account_name}
          />

          <p className="mt-6 text-xs text-cream/50">
            This is a sales collection account for receiving customer
            payments — not a personal or standalone banking product.
          </p>
        </div>
      )}
    </div>
  );
}
