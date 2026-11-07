"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSiteContent } from "@/lib/actions/admin-content";
import type { ContentField } from "@/lib/content/registry";

export function ContentEditor({
  groups,
  fields,
  overrides,
}: {
  groups: string[];
  fields: ContentField[];
  overrides: Record<string, string>;
}) {
  const router = useRouter();
  const initial = useMemo(() => {
    const o: Record<string, string> = {};
    for (const f of fields) o[f.key] = overrides[f.key] ?? f.def;
    return o;
  }, [fields, overrides]);

  const [values, setValues] = useState<Record<string, string>>(initial);
  const [group, setGroup] = useState(groups[0]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const changedKeys = fields.filter((f) => values[f.key] !== initial[f.key]).map((f) => f.key);
  const changedInGroup = (g: string) =>
    fields.filter((f) => f.group === g && values[f.key] !== initial[f.key]).length;

  const q = search.trim().toLowerCase();
  const visible = fields.filter((f) =>
    q
      ? (f.label + " " + f.def + " " + (values[f.key] ?? "") + " " + f.section + " " + f.group)
          .toLowerCase()
          .includes(q)
      : f.group === group
  );

  const sections: { group: string; section: string; items: ContentField[] }[] = [];
  for (const f of visible) {
    let s = sections.find((x) => x.group === f.group && x.section === f.section);
    if (!s) {
      s = { group: f.group, section: f.section, items: [] };
      sections.push(s);
    }
    s.items.push(f);
  }

  function save() {
    setMessage(null);
    const payload: Record<string, string> = {};
    for (const k of changedKeys) payload[k] = values[k];
    startTransition(async () => {
      const res = await saveSiteContent(payload);
      if (!res.success) return setMessage({ ok: false, text: res.error ?? "Could not save" });
      setMessage({ ok: true, text: "Saved. The changes are live on the site." });
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {groups.map((g) => {
          const n = changedInGroup(g);
          return (
            <button
              key={g}
              onClick={() => {
                setGroup(g);
                setSearch("");
              }}
              className={`rounded-full border px-4 py-1.5 text-sm ${
                group === g && !q
                  ? "border-espresso bg-espresso text-cream"
                  : "border-espresso/20 text-espresso hover:bg-espresso/5"
              }`}
            >
              {g}
              {n > 0 && <span className="ml-1.5 rounded-full bg-caramel px-1.5 text-xs text-white">{n}</span>}
            </button>
          );
        })}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search all text, for example a word you want to find and change"
        className="mb-6 w-full max-w-xl rounded-lg border border-espresso/20 bg-white px-4 py-2.5 text-sm"
      />

      {sections.length === 0 && <p className="text-sm text-rich/60">Nothing matches your search.</p>}

      <div className="space-y-6">
        {sections.map((s) => (
          <div key={s.group + s.section} className="rounded-xl2 border border-espresso/10 bg-white/60 p-5">
            <h2 className="mb-4 font-display text-lg text-espresso">
              {q ? `${s.group}: ` : ""}
              {s.section}
            </h2>
            <div className="space-y-4">
              {s.items.map((f) => {
                const edited = values[f.key] !== f.def;
                return (
                  <div key={f.key}>
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                      <label htmlFor={f.key} className="text-sm font-medium text-espresso">
                        {f.label}
                        {edited && (
                          <span className="ml-2 rounded-full bg-caramel/20 px-2 py-0.5 text-xs font-normal text-caramel">
                            edited
                          </span>
                        )}
                      </label>
                      {edited && (
                        <button
                          onClick={() => setValues((v) => ({ ...v, [f.key]: f.def }))}
                          className="text-xs text-rich/60 underline"
                        >
                          Reset to original
                        </button>
                      )}
                    </div>
                    {f.multiline ? (
                      <textarea
                        id={f.key}
                        value={values[f.key]}
                        rows={Math.min(8, Math.max(2, Math.ceil(values[f.key].length / 90)))}
                        onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                        className="w-full rounded-lg border border-espresso/20 bg-white px-3 py-2 text-sm"
                      />
                    ) : (
                      <input
                        id={f.key}
                        value={values[f.key]}
                        onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                        className="w-full rounded-lg border border-espresso/20 bg-white px-3 py-2 text-sm"
                      />
                    )}
                    {f.note && <p className="mt-1 text-xs text-rich/50">{f.note}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-16 z-30 mt-6 rounded-xl2 border border-espresso/10 bg-cream/95 px-5 py-3 shadow-premium backdrop-blur lg:bottom-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <p className={`text-sm ${message ? (message.ok ? "text-green-700" : "text-red-600") : "text-rich/60"}`}>
            {message
              ? message.text
              : changedKeys.length > 0
                ? `${changedKeys.length} unsaved change${changedKeys.length === 1 ? "" : "s"}`
                : "No unsaved changes"}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setValues(initial);
                setMessage(null);
              }}
              disabled={changedKeys.length === 0 || pending}
              className="rounded-full border border-espresso/20 px-4 py-2 text-sm text-espresso disabled:opacity-40"
            >
              Discard changes
            </button>
            <button
              onClick={save}
              disabled={changedKeys.length === 0 || pending}
              className="rounded-full bg-espresso px-6 py-2 text-sm text-cream disabled:opacity-40"
            >
              {pending ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
