"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sparkles, X, Send } from "lucide-react";
import { formatNaira } from "@/lib/utils/currency";
import { BrandImage } from "@/components/ui/BrandImage";

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  products?: Product[];
}

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi, I'm Elizabeth. Tell me what kind of scent you're after — a note you love, an occasion, even a budget — and I'll find something from our collection for you.",
};

export function AssistantWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Elizabeth is a shopping assistant — hide her inside the admin/vendor/
  // customer dashboards, where nobody's browsing to buy.
  const hidden =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/vendor") ||
    pathname.startsWith("/account");
  if (hidden) return null;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: nextMessages
            .slice(-6)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message, products: data.products },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong on my end — please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-espresso px-5 py-3 text-sm font-medium text-cream shadow-premium transition hover:bg-rich"
        >
          <Sparkles size={18} />
          Ask Elizabeth
        </button>
      )}

      {open && (
        <div className="fixed inset-x-4 bottom-4 z-40 flex h-[70vh] max-h-[560px] flex-col overflow-hidden rounded-2xl border border-espresso/10 bg-cream shadow-premium sm:inset-auto sm:bottom-5 sm:right-5 sm:w-96">
          <div className="flex items-center justify-between bg-brand-gradient px-5 py-4 text-cream">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-caramel" />
              <div>
                <p className="font-display text-sm leading-tight">Elizabeth</p>
                <p className="text-[10px] leading-tight text-cream/60">
                  Royal Fragrance Concierge
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close">
              <X size={20} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <div
                  className={`inline-block max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-espresso text-cream"
                      : "bg-white/80 text-espresso"
                  }`}
                >
                  {m.content}
                </div>
                {m.products && m.products.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {m.products.map((p) => (
                      <Link
                        key={p.id}
                        href={`/product/${p.slug}`}
                        onClick={() => setOpen(false)}
                        className="rounded-xl border border-espresso/10 bg-white/60 p-2 text-left"
                      >
                        <div className="relative aspect-square overflow-hidden rounded-lg bg-brand-100">
                          <BrandImage src={p.image} alt={p.name} className="object-cover" />
                        </div>
                        <p className="mt-1.5 truncate text-xs text-espresso">{p.name}</p>
                        <p className="text-xs text-rich/60">{formatNaira(p.price)}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="text-left">
                <div className="inline-block rounded-2xl bg-white/80 px-4 py-2.5 text-sm text-rich/50">
                  Elizabeth is thinking…
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="flex gap-2 border-t border-espresso/10 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe a scent you'd love…"
              className="flex-1 rounded-full border border-espresso/15 bg-white px-4 py-2 text-sm focus:border-caramel focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-espresso text-cream disabled:opacity-40"
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
