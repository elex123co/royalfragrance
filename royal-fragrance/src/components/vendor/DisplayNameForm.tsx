"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { updateOwnDisplayName } from "@/lib/actions/vendor-profile";

export function DisplayNameForm({ initial }: { initial: string }) {
  const router = useRouter();
  const [name, setName] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const result = await updateOwnDisplayName(name);
    setSaving(false);
    if (!result.success) {
      setMessage({ ok: false, text: result.error ?? "Could not save." });
      return;
    }
    setMessage({ ok: true, text: "Saved." });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={40}
        placeholder="e.g. Ada's Scents"
        className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
      />
      {message && (
        <p className={`text-xs ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</p>
      )}
      <Button type="submit" size="sm" disabled={saving}>
        {saving ? "Saving…" : "Save name"}
      </Button>
    </form>
  );
}
