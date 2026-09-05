import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAddresses } from "@/lib/data/account";
import { AddressForm } from "@/components/account/AddressForm";
import { DeleteAddressButton } from "@/components/account/DeleteAddressButton";

export const metadata = { title: "My Addresses — Royal Fragrance" };

export default async function AddressesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/account");

  const addresses = await getAddresses(user!.id);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-espresso">My Addresses</h1>

      <div className="mb-6 space-y-3">
        {addresses.length === 0 && (
          <p className="text-sm text-rich/50">No saved addresses yet.</p>
        )}
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className="flex items-start justify-between rounded-xl2 border border-espresso/10 bg-white/60 p-5"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-display text-espresso">{addr.label}</p>
                {addr.is_default && (
                  <span className="rounded-full bg-caramel/20 px-2 py-0.5 text-[10px] text-caramel">
                    Default
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-rich/70">
                {addr.address}, {addr.city}, {addr.state}
              </p>
            </div>
            <DeleteAddressButton addressId={addr.id} />
          </div>
        ))}
      </div>

      <AddressForm />
    </div>
  );
}
