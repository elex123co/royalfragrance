import { getCurrentVendor } from "@/lib/data/vendor";
import { DisplayNameForm } from "@/components/vendor/DisplayNameForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Profile — Vendor — Royal Fragrance" };

export default async function VendorProfilePage() {
  const vendor = await getCurrentVendor();

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl text-espresso">My Profile</h1>
      <p className="mb-6 text-sm text-rich/60">
        Choose the name customers see. It appears on your personal shop page
        (&ldquo;Shop with &hellip;&rdquo;) and on receipts you send. Your registered
        full name stays private to the team.
      </p>

      <div className="max-w-md rounded-xl2 border border-espresso/10 bg-white/60 p-6">
        <label className="mb-1.5 block text-sm font-medium text-espresso">
          Name customers see
        </label>
        <DisplayNameForm initial={vendor!.display_name ?? ""} />
        <p className="mt-4 text-xs text-rich/50">
          Leave it empty to use your registered name ({vendor!.business_name}).
        </p>
      </div>
    </div>
  );
}
