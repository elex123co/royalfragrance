import { createAdminClient } from "@/lib/supabase/server";
import { WhatsappSettingsPanel } from "@/components/admin/WhatsappSettingsPanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings — Admin — Royal Fragrance" };

export default async function AdminSettingsPage() {
  const supabase = createAdminClient();
  const { data: settings } = await supabase
    .from("whatsapp_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-espresso">Settings</h1>
      <WhatsappSettingsPanel settings={settings} />
    </div>
  );
}
