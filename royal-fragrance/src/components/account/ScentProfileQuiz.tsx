"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { saveScentProfile } from "@/lib/actions/customer";
import { useT } from "@/lib/content/client";
import { tl } from "@/lib/content/translate";

const FAMILIES = ["Woody", "Floral", "Fresh", "Spicy", "Sweet", "Smoky", "Oud", "Citrus"];
const OCCASIONS = ["Everyday", "Office", "Dates", "Parties", "Special Occasions"];
const INTENSITIES = ["Light", "Moderate", "Strong"];

interface ScentProfileQuizProps {
  initial?: {
    preferred_families: string[];
    occasions: string[];
    intensity: string | null;
  } | null;
}

export function ScentProfileQuiz({ initial }: ScentProfileQuizProps) { const _t = useT();
  const router = useRouter();
  const [families, setFamilies] = useState<string[]>(
    initial?.preferred_families ?? []
  );
  const [occasions, setOccasions] = useState<string[]>(initial?.occasions ?? []);
  const [intensity, setIntensity] = useState(initial?.intensity ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    await saveScentProfile({
      preferredFamilies: families,
      occasions,
      intensity,
    });

    setSubmitting(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className="mb-3 font-display text-lg text-espresso">{_t("account.scentprofilequiz.be2299", "What kind of scents do you enjoy?")}</h3>
        <div className="flex flex-wrap gap-2">
          {FAMILIES.map((f) => (
            <button
              type="button"
              key={f}
              onClick={() => toggle(families, setFamilies, f)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                families.includes(f)
                  ? "border-espresso bg-espresso text-cream"
                  : "border-espresso/20 text-espresso hover:border-espresso"
              }`}
            >
              {tl(_t, "account.scent", f)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-display text-lg text-espresso">{_t("account.scentprofilequiz.f56e42", "When do you mostly wear perfume?")}</h3>
        <div className="flex flex-wrap gap-2">
          {OCCASIONS.map((o) => (
            <button
              type="button"
              key={o}
              onClick={() => toggle(occasions, setOccasions, o)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                occasions.includes(o)
                  ? "border-espresso bg-espresso text-cream"
                  : "border-espresso/20 text-espresso hover:border-espresso"
              }`}
            >
              {tl(_t, "account.scent", o)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-display text-lg text-espresso">{_t("account.scentprofilequiz.088314", "What intensity do you prefer?")}</h3>
        <div className="flex flex-wrap gap-2">
          {INTENSITIES.map((i) => (
            <button
              type="button"
              key={i}
              onClick={() => setIntensity(i)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                intensity === i
                  ? "border-espresso bg-espresso text-cream"
                  : "border-espresso/20 text-espresso hover:border-espresso"
              }`}
            >
              {tl(_t, "account.scent", i)}
            </button>
          ))}
        </div>
      </div>

      {saved && (
        <p className="text-sm text-green-700">{_t("account.scentprofilequiz.65692b", "Saved — your recommendations have been updated.")}</p>
      )}

      <Button type="submit" disabled={submitting || families.length === 0}>
        {submitting ? _t("account.scentprofilequiz.56a228", "Saving…") : _t("account.scentprofilequiz.449bba", "Save My Scent Profile")}
      </Button>
    </form>
  );
}
