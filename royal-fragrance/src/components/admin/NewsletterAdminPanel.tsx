"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  toggleAutomation,
  updateNewsletterSettings,
  generatePreview,
  sendDraftNow,
  discardNewsletter,
} from "@/lib/actions/admin-newsletter";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  nigerian_humor: "Nigerian Humor 😂",
  storytelling: "Storytelling 📖",
  luxury_editorial: "Luxury Editorial 👑",
  romance: "Romance Story 💌",
  weekend_energy: "Weekend Energy 🔥",
  sunday_reflection: "Sunday Reflection 🌿",
  scent_confession: "Scent Confession 🕵🏽",
  royal_scent_chronicles: "Royal Scent Chronicles 📚",
};

interface Product {
  id: string;
  name: string;
}

interface Newsletter {
  id: string;
  title: string;
  subject: string;
  content: string;
  content_type: string;
  status: string;
  generated_at: string;
  sent_at: string | null;
  send_error: string | null;
  episode_number: number | null;
  confession_number: number | null;
  is_interactive: boolean;
  interactive_question: string | null;
}

export function NewsletterAdminPanel({
  settings,
  products,
  history,
  activeStoryline,
}: {
  settings: any;
  products: Product[];
  history: Newsletter[];
  activeStoryline: any;
}) {
  const router = useRouter();
  const [automationEnabled, setAutomationEnabled] = useState(settings?.automation_enabled ?? true);
  const [brandNotes, setBrandNotes] = useState(settings?.brand_notes ?? "");
  const [featuredIds, setFeaturedIds] = useState<string[]>(settings?.featured_product_ids ?? []);
  const [excludedIds, setExcludedIds] = useState<string[]>(settings?.excluded_product_ids ?? []);
  const [savingSettings, setSavingSettings] = useState(false);
  const [previewDay, setPreviewDay] = useState<"monday" | "friday" | "sunday">("monday");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleToggle() {
    const next = !automationEnabled;
    setAutomationEnabled(next);
    await toggleAutomation(next);
  }

  async function handleSaveSettings() {
    setSavingSettings(true);
    await updateNewsletterSettings({ brandNotes, featuredProductIds: featuredIds, excludedProductIds: excludedIds });
    setSavingSettings(false);
  }

  async function handleGenerate() {
    setGenerating(true);
    setGenError(null);
    const result = await generatePreview(previewDay);
    setGenerating(false);
    if (!result.success && result.status !== "held_for_review") {
      setGenError(result.reason ?? "Generation failed");
    }
    router.refresh();
  }

  function toggleId(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((i) => i !== id) : [...list, id]);
  }

  return (
    <div className="space-y-8">
      {/* Automation control */}
      <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg text-espresso">Automation</h2>
            <p className="text-sm text-rich/60">
              {automationEnabled
                ? "Elizabeth will send automatically on schedule."
                : "Automation is paused — scheduled sends will be skipped."}
            </p>
          </div>
          <button
            onClick={handleToggle}
            className={`relative h-7 w-12 rounded-full transition ${
              automationEnabled ? "bg-espresso" : "bg-espresso/20"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-cream transition ${
                automationEnabled ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg bg-cream/60 p-3">
            <p className="text-xs text-rich/50">Monday</p>
            <p className="text-espresso">{settings?.monday_time ?? "08:00"} WAT</p>
          </div>
          <div className="rounded-lg bg-cream/60 p-3">
            <p className="text-xs text-rich/50">Friday</p>
            <p className="text-espresso">{settings?.friday_time ?? "10:00"} WAT</p>
          </div>
          <div className="rounded-lg bg-cream/60 p-3">
            <p className="text-xs text-rich/50">Sunday</p>
            <p className="text-espresso">{settings?.sunday_time ?? "18:00"} WAT</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-rich/50">
          Changing these exact times requires a code change and redeploy (they're
          set as cron schedules in the Netlify Functions) — pause/resume above is
          the one control that takes effect immediately.
        </p>
      </div>

      {/* Active storyline */}
      {activeStoryline && (
        <div className="rounded-xl2 border border-espresso/10 bg-brand-gradient p-6 text-cream">
          <p className="text-xs uppercase tracking-widest text-sand">
            Active Storyline — Episode {activeStoryline.current_episode}
          </p>
          <h3 className="mt-1 font-display text-lg">{activeStoryline.title}</h3>
          <p className="mt-2 text-sm text-cream/70">{activeStoryline.summary}</p>
          {activeStoryline.story_characters?.length > 0 && (
            <p className="mt-2 text-xs text-cream/50">
              Characters: {activeStoryline.story_characters.map((c: any) => c.name).join(", ")}
            </p>
          )}
        </div>
      )}

      {/* Campaign guidance */}
      <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-6">
        <h2 className="mb-3 font-display text-lg text-espresso">Campaign Guidance</h2>

        <label className="mb-1.5 block text-sm font-medium text-espresso">
          Brand notes for Elizabeth (optional context for upcoming newsletters)
        </label>
        <textarea
          value={brandNotes}
          onChange={(e) => setBrandNotes(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm"
          placeholder="e.g. We just launched a new oud collection — feel free to mention it this week."
        />

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-sm font-medium text-espresso">Featured products</p>
            <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-espresso/10 p-2">
              {products.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm text-rich/80">
                  <input
                    type="checkbox"
                    checked={featuredIds.includes(p.id)}
                    onChange={() => toggleId(featuredIds, setFeaturedIds, p.id)}
                  />
                  {p.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-espresso">Never promote</p>
            <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-espresso/10 p-2">
              {products.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm text-rich/80">
                  <input
                    type="checkbox"
                    checked={excludedIds.includes(p.id)}
                    onChange={() => toggleId(excludedIds, setExcludedIds, p.id)}
                  />
                  {p.name}
                </label>
              ))}
            </div>
          </div>
        </div>

        <Button className="mt-4" size="sm" onClick={handleSaveSettings} disabled={savingSettings}>
          {savingSettings ? "Saving…" : "Save Guidance"}
        </Button>
      </div>

      {/* Manual test generation */}
      <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-6">
        <h2 className="mb-3 font-display text-lg text-espresso">Generate a Preview</h2>
        <p className="mb-4 text-sm text-rich/60">
          Runs the full pipeline for a chosen day without sending anything — useful for
          testing before relying on the schedule. It lands in the history below as a
          draft you can review, then send or discard.
        </p>
        <div className="flex gap-3">
          <select
            value={previewDay}
            onChange={(e) => setPreviewDay(e.target.value as any)}
            className="rounded-lg border border-espresso/15 px-4 py-2 text-sm"
          >
            <option value="monday">Monday</option>
            <option value="friday">Friday</option>
            <option value="sunday">Sunday</option>
          </select>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? "Elizabeth is writing…" : "Generate Preview"}
          </Button>
        </div>
        {genError && (
          <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{genError}</p>
        )}
      </div>

      {/* History */}
      <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-6">
        <h2 className="mb-4 font-display text-lg text-espresso">History</h2>
        <div className="space-y-3">
          {history.length === 0 && (
            <p className="text-sm text-rich/50">Nothing generated yet.</p>
          )}
          {history.map((n) => (
            <NewsletterRow key={n.id} newsletter={n} isPending={isPending} startTransition={startTransition} />
          ))}
        </div>
      </div>
    </div>
  );
}

function NewsletterRow({
  newsletter,
  isPending,
  startTransition,
}: {
  newsletter: Newsletter;
  isPending: boolean;
  startTransition: (fn: () => void) => void;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const statusStyle: Record<string, string> = {
    sent: "bg-green-100 text-green-700",
    draft: "bg-amber-100 text-amber-700",
    held_for_review: "bg-red-100 text-red-700",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <div className="rounded-xl border border-espresso/10 bg-cream/60 p-4">
      <button onClick={() => setExpanded((v) => !v)} className="flex w-full items-center justify-between text-left">
        <div>
          <p className="font-display text-sm text-espresso">{newsletter.title}</p>
          <p className="text-xs text-rich/50">
            {CONTENT_TYPE_LABELS[newsletter.content_type] ?? newsletter.content_type}
            {newsletter.episode_number ? ` · Episode ${newsletter.episode_number}` : ""}
            {newsletter.confession_number ? ` · Confession #${String(newsletter.confession_number).padStart(3, "0")}` : ""}
            {" · "}
            {new Date(newsletter.generated_at).toLocaleString()}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs capitalize ${statusStyle[newsletter.status] ?? ""}`}>
          {newsletter.status.replaceAll("_", " ")}
        </span>
      </button>

      {expanded && (
        <div className="mt-3 border-t border-espresso/10 pt-3">
          <p className="mb-2 text-xs text-rich/50">Subject: {newsletter.subject}</p>
          {newsletter.send_error && (
            <p className="mb-2 text-xs text-red-600">Issue: {newsletter.send_error}</p>
          )}
          <div
            className="prose prose-sm max-w-none text-sm text-rich/80"
            dangerouslySetInnerHTML={{ __html: newsletter.content }}
          />
          {(newsletter.status === "draft" || newsletter.status === "held_for_review") && (
            <div className="mt-4 flex gap-3">
              <Button
                size="sm"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await sendDraftNow(newsletter.id);
                    router.refresh();
                  })
                }
              >
                Send This Now
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-espresso/20 text-espresso"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await discardNewsletter(newsletter.id);
                    router.refresh();
                  })
                }
              >
                Discard
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
