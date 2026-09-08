"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { setAmbassadorLevel } from "@/lib/actions/admin-vendors";

export function AmbassadorLevelForm({
  vendorId,
  initialLevel,
}: {
  vendorId: string;
  initialLevel: string | null;
}) {
  const router = useRouter();
  const [level, setLevel] = useState(initialLevel ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await setAmbassadorLevel(vendorId, level);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <input
        value={level}
        onChange={(e) => setLevel(e.target.value)}
        placeholder="e.g. Bronze, Silver, Gold"
        className="flex-1 rounded-lg border border-espresso/15 px-3 py-2 text-sm"
      />
      <Button size="sm" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
