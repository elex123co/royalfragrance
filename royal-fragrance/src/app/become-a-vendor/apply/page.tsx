import Link from "next/link";
import { validateAndConsumeVendorToken } from "@/lib/actions/vendor-interest";
import { VendorApplicationForm } from "@/components/vendor/VendorApplicationForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vendor Application — Royal Fragrance" };

export default async function VendorApplyPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const result = await validateAndConsumeVendorToken(searchParams.token ?? "");

  if (!result.valid) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center bg-cream px-5 py-16">
        <div className="max-w-md rounded-xl2 border border-espresso/10 bg-white/60 p-8 text-center shadow-premium-sm">
          <h1 className="font-display text-2xl text-espresso">Link Invalid or Expired</h1>
          <p className="mt-3 text-sm text-rich/70">
            This application link has already been used or isn't valid.
            Request a new one below.
          </p>
          <Link
            href="/become-a-vendor"
            className="mt-6 inline-block rounded-full bg-espresso px-6 py-3 text-sm text-cream hover:bg-rich"
          >
            Request a New Link
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-xl px-5 lg:px-8">
        <h1 className="mb-2 font-display text-3xl text-espresso">
          Vendor Application
        </h1>
        <p className="mb-8 text-rich/70">
          Fill in your details below — this only takes a few minutes.
        </p>
        <VendorApplicationForm initialEmail={result.email} />
      </div>
    </section>
  );
}
