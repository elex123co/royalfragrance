"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { updateWhatsappSettings } from "@/lib/actions/admin-settings";

interface Settings {
  business_phone: string | null;
  group_link: string | null;
}

export function WhatsappSettingsPanel({ settings }: { settings: Settings | null }) {
  const router = useRouter();
  const [businessPhone, setBusinessPhone] = useState(settings?.business_phone ?? "");
  const [groupLink, setGroupLink] = useState(settings?.group_link ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await updateWhatsappSettings({ businessPhone, groupLink });
    setSaving(false);
    if (!result.success) {
      setError(result.error ?? "Could not save.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="max-w-xl rounded-xl2 border border-espresso/10 bg-white/60 p-4 sm:p-6">
      <h2 className="mb-1 font-display text-lg text-espresso">WhatsApp</h2>
      <p className="mb-4 text-sm text-rich/60">
        Shown to customers right after checkout, inviting them to save your
        number and join your group/channel.
      </p>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-espresso">
            Business phone number
          </label>
          <input
            value={businessPhone}
            onChange={(e) => setBusinessPhone(e.target.value)}
            placeholder="e.g. 2347040218594 (with country code, no + or spaces)"
            className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-espresso">
            Group/Channel invite link
          </label>
          <input
            value={groupLink}
            onChange={(e) => setGroupLink(e.target.value)}
            placeholder="https://chat.whatsapp.com/..."
            className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
          />
          <p className="mt-1 text-xs text-rich/50">
            Paste the full link starting with https:// — copy it directly
            from WhatsApp's "Invite to Group via Link" option.
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <Button className="mt-4 w-full sm:w-auto" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
