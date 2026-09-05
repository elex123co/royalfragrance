import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/data/account";
import { SettingsForm } from "@/components/account/SettingsForm";

export const metadata = { title: "Account Settings — Royal Fragrance" };

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/account");

  const profile = await getProfile(user!.id);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-espresso">
        Account Settings
      </h1>
      <SettingsForm
        initialName={profile?.name ?? ""}
        initialPhone={profile?.phone ?? ""}
        email={profile?.email ?? user!.email ?? ""}
      />
    </div>
  );
}
