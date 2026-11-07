import { getCurrentVendor } from "@/lib/data/vendor";
import { DisplayNameForm } from "@/components/vendor/DisplayNameForm";
import { getT } from "@/lib/content/server";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const _t = await getT();
  return { title: _t("meta.vendor.profile.title", "My Profile — Vendor — Royal Fragrance") 
  };
}

export default async function VendorProfilePage() { const _t = await getT();
  const vendor = await getCurrentVendor();

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl text-espresso">{_t("vendor.profile.9ba8d3", "My Profile")}</h1>
      <p className="mb-6 text-sm text-rich/60">{_t("vendor.profile.84dc6c", "Choose the name customers see. It appears on your personal shop page (“Shop with …”) and on receipts you send. Your registered full name stays private to the team.")}</p>

      <div className="max-w-md rounded-xl2 border border-espresso/10 bg-white/60 p-6">
        <label className="mb-1.5 block text-sm font-medium text-espresso">{_t("vendor.profile.95cf10", "Name customers see")}</label>
        <DisplayNameForm initial={vendor!.display_name ?? ""} />
        <p className="mt-4 text-xs text-rich/50">{_t("vendor.profile.3c2744", "Leave it empty to use your registered name ({business_name}).", { business_name: vendor!.business_name })}</p>
      </div>
    </div>
  );
}
