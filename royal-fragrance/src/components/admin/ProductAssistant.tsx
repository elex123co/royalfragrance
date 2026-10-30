"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Paperclip, Send, X, Sparkles, LayoutGrid, MessageSquare } from "lucide-react";
import { compressImage, photoHash } from "@/lib/image-client";
import {
  fetchGallery,
  publishGalleryDraft,
  saveGalleryDraft,
  removeGalleryItem,
  discardGalleryDraft,
  requeueGalleryItem,
} from "@/lib/actions/admin-gallery";
import { formatNaira } from "@/lib/utils/currency";
import type { GalleryItem, GalleryDraft } from "@/lib/types/gallery";

interface Category {
  id: string;
  name: string;
  parent_category_id?: string | null;
}

interface Msg {
  id: number;
  role: "user" | "assistant";
  text: string;
  thumbs?: string[];
}

let msgCounter = 1;

const STATUS_LABEL: Record<string, string> = {
  new: "Waiting",
  extracted: "Read",
  ready: "Draft",
  published: "In the shop",
  duplicate: "Already in shop",
  failed: "Needs attention",
};

const STATUS_STYLE: Record<string, string> = {
  new: "bg-espresso/10 text-espresso",
  extracted: "bg-amber-100 text-amber-800",
  ready: "bg-caramel/20 text-espresso",
  published: "bg-green-100 text-green-800",
  duplicate: "bg-red-100 text-red-700",
  failed: "bg-red-100 text-red-700",
};

async function post(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json().catch(() => ({ success: false }));
}

export function ProductAssistant({
  initialItems,
  categories,
}: {
  initialItems: GalleryItem[];
  categories: Category[];
}) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems);
  const [tab, setTab] = useState<"chat" | "gallery">("chat");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [staged, setStaged] = useState<{ file: File; preview: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const waiting = items.filter((i) => i.status === "new" || i.status === "extracted");
  const drafts = items.filter((i) => i.status === "ready" && i.product);
  const attention = items.filter((i) => i.status === "duplicate" || i.status === "failed");

  const greeting = useMemo(() => {
    const parts: string[] = [];
    if (drafts.length) parts.push(`${drafts.length} draft${drafts.length === 1 ? "" : "s"} waiting for your review`);
    if (waiting.length) parts.push(`${waiting.length} photo${waiting.length === 1 ? "" : "s"} in the gallery not yet turned into products`);
    return (
      "Drop in photos of your perfume cartons and I will read each one, skip anything the shop already sells, and prepare a product with a proper name, sizes, caption and description. Nothing goes live until you publish it." +
      (parts.length ? ` Right now: ${parts.join(", ")}.` : "")
    );
    // Only the first greeting; later state changes are shown in the cards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, drafts.length, tab]);

  function say(role: Msg["role"], t: string, thumbs?: string[]) {
    const id = msgCounter++;
    setMessages((m) => [...m, { id, role, text: t, thumbs }]);
    return id;
  }
  function edit(id: number, t: string) {
    setMessages((m) => m.map((x) => (x.id === id ? { ...x, text: t } : x)));
  }

  async function reload() {
    setItems(await fetchGallery());
  }

  function stage(files: FileList | File[]) {
    const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (imgs.length === 0) return;
    setStaged((s) => [...s, ...imgs.map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
  }

  async function send() {
    if (busy) return;
    const t = text.trim();
    if (staged.length === 0) {
      if (!t) return;
      say("user", t);
      setText("");
      if (/generat|start|process|go\b|turn|make|create|read/i.test(t)) {
        if (waiting.length === 0) say("assistant", "There are no new photos in the gallery. Attach some and I will start straight away.");
        else await runProcess(waiting.map((i) => ({ id: i.id, status: i.status })));
      } else {
        say("assistant", "Attach photos of your perfume cartons with the paperclip, or tell me to generate products from the gallery.");
      }
      return;
    }

    const batch = staged;
    setStaged([]);
    setText("");
    say("user", t || `Here ${batch.length === 1 ? "is a photo" : `are ${batch.length} photos`}.`, batch.map((b) => b.preview));
    setBusy(true);
    const note = say("assistant", `Adding ${batch.length} photo${batch.length === 1 ? "" : "s"} to the gallery...`);

    const added: { id: string; status: "new" }[] = [];
    let skipped = 0;
    let failed = 0;
    const queue = [...batch];
    async function uploadWorker() {
      while (queue.length) {
        const { file } = queue.shift()!;
        try {
          const small = await compressImage(file, true);
          const phash = await photoHash(small);
          const fd = new FormData();
          fd.append("file", small);
          fd.append("phash", phash);
          const res = await (await fetch("/api/admin/gallery/upload", { method: "POST", body: fd })).json();
          if (res.success && res.skipped) skipped++;
          else if (res.success && res.id) added.push({ id: res.id, status: "new" });
          else failed++;
        } catch {
          failed++;
        }
        edit(note, `Adding photos to the gallery... ${added.length + skipped + failed} of ${batch.length}`);
      }
    }
    await Promise.all([uploadWorker(), uploadWorker(), uploadWorker()]);
    edit(
      note,
      `Added ${added.length} new photo${added.length === 1 ? "" : "s"} to the gallery.` +
        (skipped ? ` Skipped ${skipped} that were already there.` : "") +
        (failed ? ` ${failed} could not be uploaded.` : "")
    );
    setBusy(false);
    await reload();
    if (added.length > 0) await runProcess(added);
  }

  async function runProcess(list: { id: string; status: string }[]) {
    setBusy(true);
    const progress = say("assistant", `Reading your photos... 0 of ${list.length}`);
    const tally = { draft: 0, duplicate: 0, extra: 0, failed: 0 };
    let done = 0;
    const queue = [...list];
    async function worker() {
      while (queue.length) {
        const job = queue.shift()!;
        try {
          let ok = true;
          if (job.status === "new") {
            const ex = await post("/api/admin/gallery/process", { op: "extract", id: job.id });
            ok = !!ex.success;
          }
          if (ok) {
            const c = await post("/api/admin/gallery/process", { op: "compose", id: job.id });
            if (!c.success) tally.failed++;
            else if (c.outcome === "duplicate") tally.duplicate++;
            else if (c.outcome === "extra-photo") tally.extra++;
            else tally.draft++;
          } else tally.failed++;
        } catch {
          tally.failed++;
        }
        done++;
        edit(progress, `Reading your photos... ${done} of ${list.length}`);
      }
    }
    await Promise.all([worker(), worker(), worker()]);
    await reload();
    const bits: string[] = [];
    if (tally.draft) bits.push(`${tally.draft} new draft${tally.draft === 1 ? "" : "s"} ready`);
    if (tally.extra) bits.push(`${tally.extra} extra photo${tally.extra === 1 ? "" : "s"} added to a draft`);
    if (tally.duplicate) bits.push(`${tally.duplicate} skipped because the shop already has ${tally.duplicate === 1 ? "it" : "them"}`);
    if (tally.failed) bits.push(`${tally.failed} I could not read`);
    edit(
      progress,
      `Done. ${bits.join(", ") || "Nothing to do"}.` +
        (tally.draft ? " Check each draft below, set the prices and stock, correct anything you want, then publish." : "")
    );
    setBusy(false);
  }

  async function createAnyway(id: string) {
    setBusy(true);
    const r = await post("/api/admin/gallery/process", { op: "compose", id, force: true });
    await reload();
    say("assistant", r.success ? "Created a draft from that photo anyway." : "I could not create that draft. Try again.");
    setBusy(false);
  }

  return (
    <div
      className={`flex h-[calc(100vh-9rem)] min-h-[520px] flex-col overflow-hidden rounded-xl2 border bg-white/60 ${
        dragging ? "border-caramel" : "border-espresso/10"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        stage(e.dataTransfer.files);
      }}
    >
      <div className="flex items-center justify-between border-b border-espresso/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-espresso text-cream">
            <Sparkles size={16} />
          </span>
          <div>
            <p className="font-display text-base text-espresso">Product Assistant</p>
            <p className="text-xs text-rich/60">Photos in, ready-to-review products out</p>
          </div>
        </div>
        <div className="flex gap-1 rounded-full bg-espresso/5 p-1 text-xs">
          <button
            onClick={() => setTab("chat")}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 ${tab === "chat" ? "bg-espresso text-cream" : "text-espresso"}`}
          >
            <MessageSquare size={13} /> Chat
          </button>
          <button
            onClick={() => setTab("gallery")}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 ${tab === "gallery" ? "bg-espresso text-cream" : "text-espresso"}`}
          >
            <LayoutGrid size={13} /> Gallery ({items.length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        {tab === "chat" ? (
          <div className="mx-auto max-w-3xl space-y-4">
            <Bubble role="assistant" text={greeting} />
            {messages.map((m) => (
              <Bubble key={m.id} role={m.role} text={m.text} thumbs={m.thumbs} />
            ))}

            {drafts.length > 0 && (
              <div className="space-y-4 pt-2">
                <p className="text-xs uppercase tracking-wide text-rich/50">Drafts to review</p>
                {drafts.map((i) => (
                  <DraftCard key={i.product!.id} draft={i.product!} categories={categories} onChanged={reload} />
                ))}
              </div>
            )}

            {attention.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs uppercase tracking-wide text-rich/50">Needs your attention</p>
                {attention.map((i) => (
                  <div key={i.id} className="flex items-center gap-3 rounded-xl border border-espresso/10 bg-white p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={i.url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="text-espresso">{i.note}</p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1 text-xs">
                      {i.status === "duplicate" ? (
                        <button disabled={busy} onClick={() => createAnyway(i.id)} className="rounded-full border border-espresso/20 px-3 py-1 hover:bg-espresso/5">
                          Create anyway
                        </button>
                      ) : (
                        <button
                          disabled={busy}
                          onClick={async () => {
                            await requeueGalleryItem(i.id);
                            await reload();
                            await runProcess([{ id: i.id, status: "new" }]);
                          }}
                          className="rounded-full border border-espresso/20 px-3 py-1 hover:bg-espresso/5"
                        >
                          Try again
                        </button>
                      )}
                      <button
                        disabled={busy}
                        onClick={async () => {
                          await removeGalleryItem(i.id);
                          await reload();
                        }}
                        className="rounded-full px-3 py-1 text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>
        ) : (
          <div className="mx-auto max-w-5xl">
            {items.length === 0 ? (
              <p className="text-sm text-rich/60">The gallery is empty. Attach photos in the chat to add them.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {items.map((i) => (
                  <div key={i.id} className="overflow-hidden rounded-xl border border-espresso/10 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={i.url} alt="" className="aspect-square w-full object-cover" />
                    <div className="space-y-1 p-2 text-xs">
                      <span className={`inline-block rounded-full px-2 py-0.5 ${STATUS_STYLE[i.status]}`}>{STATUS_LABEL[i.status]}</span>
                      {i.product && <p className="truncate text-espresso">{i.product.name}</p>}
                      {i.status !== "published" && (
                        <button
                          onClick={async () => {
                            const r = await removeGalleryItem(i.id);
                            if (r.success) await reload();
                          }}
                          className="block text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-espresso/10 bg-white/80 p-3">
        <div className="mx-auto max-w-3xl">
          {staged.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {staged.map((s, idx) => (
                <div key={s.preview} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.preview} alt="" className="h-14 w-14 rounded-lg object-cover" />
                  <button
                    onClick={() => setStaged((x) => x.filter((_, j) => j !== idx))}
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-espresso p-0.5 text-cream"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {waiting.length > 0 && !busy && (
            <button
              onClick={() => runProcess(waiting.map((i) => ({ id: i.id, status: i.status })))}
              className="mb-2 rounded-full border border-caramel/50 bg-caramel/10 px-3 py-1 text-xs text-espresso hover:bg-caramel/20"
            >
              Generate products from {waiting.length} gallery photo{waiting.length === 1 ? "" : "s"}
            </button>
          )}
          <div className="flex items-end gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files) stage(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="shrink-0 rounded-full border border-espresso/20 p-2.5 text-espresso hover:bg-espresso/5 disabled:opacity-40"
              aria-label="Attach photos"
            >
              <Paperclip size={18} />
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={staged.length ? "Add a note, or just send" : "Attach perfume photos, or type \"generate\""}
              className="flex-1 rounded-full border border-espresso/15 bg-white px-4 py-2.5 text-sm focus:border-caramel focus:outline-none"
            />
            <button
              onClick={send}
              disabled={busy || (staged.length === 0 && !text.trim())}
              className="shrink-0 rounded-full bg-espresso p-2.5 text-cream hover:bg-rich disabled:opacity-40"
              aria-label="Send"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bubble({ role, text, thumbs }: { role: "user" | "assistant"; text: string; thumbs?: string[] }) {
  const mine = role === "user";
  return (
    <div className={`flex gap-2 ${mine ? "justify-end" : ""}`}>
      {!mine && (
        <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-espresso text-cream">
          <Sparkles size={13} />
        </span>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
          mine ? "rounded-br-md bg-espresso text-cream" : "rounded-bl-md border border-espresso/10 bg-white text-rich"
        }`}
      >
        {thumbs && thumbs.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {thumbs.slice(0, 12).map((t) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={t} src={t} alt="" className="h-14 w-14 rounded-lg object-cover" />
            ))}
            {thumbs.length > 12 && <span className="self-center text-xs">+{thumbs.length - 12}</span>}
          </div>
        )}
        <p className="whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
}

function DraftCard({
  draft,
  categories,
  onChanged,
}: {
  draft: GalleryDraft;
  categories: Category[];
  onChanged: () => Promise<void>;
}) {
  const [name, setName] = useState(draft.name);
  const [caption, setCaption] = useState(draft.caption);
  const [description, setDescription] = useState(draft.description);
  const [categoryId, setCategoryId] = useState(draft.categoryId ?? "");
  const [type, setType] = useState(draft.type);
  const [variants, setVariants] = useState(draft.variants);
  const [busy, setBusy] = useState<"save" | "publish" | "remove" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const payload = () => ({
    name,
    caption,
    description,
    categoryId: categoryId || null,
    type,
    variants,
  });

  const field = "w-full rounded-lg border border-espresso/15 bg-white px-3 py-2 text-sm focus:border-caramel focus:outline-none";
  const noteCount = draft.notes.top.length + draft.notes.heart.length + draft.notes.base.length;

  async function run(kind: "save" | "publish") {
    setBusy(kind);
    setMsg(null);
    const res = kind === "save" ? await saveGalleryDraft(draft.id, payload()) : await publishGalleryDraft(draft.id, payload());
    setBusy(null);
    if (!res.success) return setMsg({ ok: false, text: res.error ?? "Could not save." });
    setMsg({ ok: true, text: kind === "save" ? "Saved." : "Published to the shop." });
    if (kind === "publish") await onChanged();
  }

  return (
    <div className="overflow-hidden rounded-xl2 border border-espresso/10 bg-white">
      <div className="flex gap-3 p-4">
        <div className="flex w-24 shrink-0 flex-col gap-1.5">
          {draft.images.slice(0, 3).map((u) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={u} src={u} alt="" className="aspect-square w-full rounded-lg object-cover" />
          ))}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <label className="block text-xs text-rich/60">
            Name
            <input className={field} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block text-xs text-rich/60">
            Caption ({caption.length}/100)
            <input className={field} value={caption} onChange={(e) => setCaption(e.target.value)} />
          </label>
          <label className="block text-xs text-rich/60">
            Description
            <textarea className={field} rows={6} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>

          <div className="text-xs">
            {draft.notesSource === "carton" && (
              <span className="rounded-full bg-green-100 px-2.5 py-1 text-green-800">Notes read from the box</span>
            )}
            {draft.notesSource === "knowledge" && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">
                Notes are from general knowledge, please check them
              </span>
            )}
            {draft.notesSource === "none" && (
              <span className="rounded-full bg-espresso/10 px-2.5 py-1 text-espresso">No notes were printed, so none are claimed</span>
            )}
            {noteCount > 0 && (
              <p className="mt-1.5 text-rich/70">
                {[
                  draft.notes.top.length ? `Top: ${draft.notes.top.join(", ")}` : "",
                  draft.notes.heart.length ? `Heart: ${draft.notes.heart.join(", ")}` : "",
                  draft.notes.base.length ? `Base: ${draft.notes.base.join(", ")}` : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-rich/60">
              Category
              <select className={field} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-rich/60">
              Type
              <input className={field} value={type} onChange={(e) => setType(e.target.value)} placeholder="Eau de Parfum" />
            </label>
          </div>

          <div>
            <p className="mb-1 text-xs text-rich/60">Sizes, prices and stock</p>
            <div className="space-y-2">
              {variants.map((v, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    className={`${field} w-24`}
                    value={v.size}
                    placeholder="100ml"
                    onChange={(e) => setVariants((vs) => vs.map((x, j) => (j === idx ? { ...x, size: e.target.value } : x)))}
                  />
                  <input
                    className={`${field} w-28`}
                    type="number"
                    min={0}
                    value={v.price || ""}
                    placeholder="Price"
                    onChange={(e) => setVariants((vs) => vs.map((x, j) => (j === idx ? { ...x, price: Number(e.target.value) } : x)))}
                  />
                  <input
                    className={`${field} w-20`}
                    type="number"
                    min={0}
                    value={v.stock || ""}
                    placeholder="Stock"
                    onChange={(e) => setVariants((vs) => vs.map((x, j) => (j === idx ? { ...x, stock: Number(e.target.value) } : x)))}
                  />
                  <button onClick={() => setVariants((vs) => vs.filter((_, j) => j !== idx))} className="text-rich/40 hover:text-red-600" aria-label="Remove size">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setVariants((vs) => [...vs, { size: "", price: 0, stock: 0 }])}
              className="mt-2 text-xs text-espresso underline"
            >
              + Add size
            </button>
            {variants.some((v) => v.price > 0) && (
              <p className="mt-1 text-xs text-rich/50">Shown from {formatNaira(Math.min(...variants.filter((v) => v.price > 0).map((v) => v.price)))}</p>
            )}
          </div>

          {msg && <p className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => run("publish")}
              disabled={busy !== null}
              className="rounded-full bg-espresso px-5 py-2 text-sm text-cream hover:bg-rich disabled:opacity-40"
            >
              {busy === "publish" ? "Publishing..." : "Publish to shop"}
            </button>
            <button
              onClick={() => run("save")}
              disabled={busy !== null}
              className="rounded-full border border-espresso/20 px-5 py-2 text-sm text-espresso hover:bg-espresso/5 disabled:opacity-40"
            >
              {busy === "save" ? "Saving..." : "Save draft"}
            </button>
            <button
              onClick={async () => {
                if (!confirm("Discard this draft and its photos?")) return;
                setBusy("remove");
                const res = await discardGalleryDraft(draft.id);
                setBusy(null);
                if (!res.success) return setMsg({ ok: false, text: res.error ?? "Could not discard." });
                await onChanged();
              }}
              disabled={busy !== null}
              className="rounded-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40"
            >
              Discard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
