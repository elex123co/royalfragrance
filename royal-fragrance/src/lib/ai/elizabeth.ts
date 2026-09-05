import { callGroq } from "@/lib/ai/groq";
import { getAllProducts } from "@/lib/data/products";
import type { Product } from "@/lib/types/product";

const PERSONA = `You are Elizabeth, Royal Fragrance's in-house fragrance concierge.
You're warm, a little witty, and genuinely knowledgeable about scents — think a
well-traveled friend who happens to know fragrance notes cold, not a corporate
chatbot. Keep replies conversational and fairly short (2-5 sentences plus the
product mentions). Never invent products, prices, or stock — only ever
recommend from the exact product list you're given.`;

interface ExtractedCriteria {
  families: string[]; // e.g. ["Oud", "Vanilla"]
  category: string | null; // e.g. "Men's Fragrances"
  minBudget: number | null;
  maxBudget: number | null;
  keywords: string[]; // any other descriptive words worth matching
}

async function extractCriteria(userMessage: string): Promise<ExtractedCriteria> {
  const raw = await callGroq(
    [
      {
        role: "system",
        content: `Extract fragrance search criteria from the customer's message as JSON.
Schema: { "families": string[], "category": string|null, "minBudget": number|null, "maxBudget": number|null, "keywords": string[] }
"families" are scent families/notes mentioned (e.g. Oud, Vanilla, Woody, Citrus, Floral, Spicy, Sweet, Smoky, Fresh).
"category" is only set if they clearly mean Men's/Women's/Unisex/Oud/Designer/Niche/Gift Sets.
Budgets are in Nigerian Naira if mentioned. Return ONLY the JSON object, nothing else.`,
      },
      { role: "user", content: userMessage },
    ],
    { json: true }
  );

  try {
    const parsed = JSON.parse(raw);
    return {
      families: Array.isArray(parsed.families) ? parsed.families : [],
      category: parsed.category ?? null,
      minBudget: typeof parsed.minBudget === "number" ? parsed.minBudget : null,
      maxBudget: typeof parsed.maxBudget === "number" ? parsed.maxBudget : null,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    };
  } catch {
    return { families: [], category: null, minBudget: null, maxBudget: null, keywords: [] };
  }
}

function scoreProduct(product: Product, criteria: ExtractedCriteria): number {
  if (product.status !== "active") return -1;
  if (criteria.minBudget !== null && product.price < criteria.minBudget) return -1;
  if (criteria.maxBudget !== null && product.price > criteria.maxBudget) return -1;

  let score = 0;
  const noteText = [
    ...(product.notes?.top ?? []),
    ...(product.notes?.heart ?? []),
    ...(product.notes?.base ?? []),
  ]
    .join(" ")
    .toLowerCase();

  const haystack = `${noteText} ${product.name} ${product.shortDescription} ${product.category}`.toLowerCase();

  for (const term of [...criteria.families, ...criteria.keywords]) {
    if (haystack.includes(term.toLowerCase())) score += 2;
  }
  if (criteria.category && product.category.toLowerCase() === criteria.category.toLowerCase()) {
    score += 3;
  }
  return score;
}

export interface AssistantResult {
  message: string;
  products: Product[];
}

export async function askElizabeth(
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<AssistantResult> {
  const criteria = await extractCriteria(userMessage);
  const allProducts = await getAllProducts();

  const scored = allProducts
    .map((p) => ({ product: p, score: scoreProduct(p, criteria) }))
    .filter((s) => s.score >= 0)
    .sort((a, b) => b.score - a.score);

  // If nothing scored above zero (no real match), fall back to a small
  // active sample so Elizabeth can still say something useful rather than
  // recommending nothing at all when criteria were vague.
  const matches = (scored.some((s) => s.score > 0) ? scored.filter((s) => s.score > 0) : scored)
    .slice(0, 6)
    .map((s) => s.product);

  const catalogSummary = matches
    .map(
      (p) =>
        `- ${p.name} (${p.category}, ₦${p.price.toLocaleString()}) — ${p.shortDescription}${
          p.notes ? ` [notes: ${[...(p.notes.top ?? []), ...(p.notes.heart ?? []), ...(p.notes.base ?? [])].join(", ")}]` : ""
        }`
    )
    .join("\n");

  const reply = await callGroq([
    { role: "system", content: PERSONA },
    ...history.map((h) => ({ role: h.role, content: h.content })),
    {
      role: "user",
      content: `Customer said: "${userMessage}"

Here are the ONLY products you may recommend (real current inventory — never mention anything not on this list):
${catalogSummary || "(No matching products found in stock.)"}

Write Elizabeth's reply. If the list is empty, say so warmly and suggest they browse the full shop or describe what they're after differently.`,
    },
  ]);

  return { message: reply, products: matches.slice(0, 4) };
}
