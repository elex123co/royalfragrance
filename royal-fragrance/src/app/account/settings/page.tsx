import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/data/account";
import { SettingsForm } from "@/components/account/SettingsForm";
import { getT } from "@/lib/content/server";

export async function generateMetadata() {
  const _t = await getT();
  return { title: _t("meta.account.settings.title", "Account Settings — Royal Fragrance") 
  };
}

export default async function SettingsPage() { const _t = await getT();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/account");

  const profile = await getProfile(user!.id);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-espresso">{_t("account.settings.e32707", "Account Settings")}</h1>
      <SettingsForm
        initialName={profile?.name ?? ""}
        initialPhone={profile?.phone ?? ""}
        email={profile?.email ?? user!.email ?? ""}
      />
    </div>
  );
}
