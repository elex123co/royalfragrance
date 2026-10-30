import { callGroq, callGroqVision, callGeminiVision } from "./groq";

/** What is actually printed on / visible in the packaging photo. */
export interface PackagingFacts {
  brand: string | null;
  productName: string | null;
  line: string | null;
  concentration: string | null; // Eau de Parfum, Eau de Toilette, Parfum, Attar...
  volumesMl: number[];
  targetGender: "men" | "women" | "unisex" | null;
  printedNotes: { top: string[]; heart: string[]; base: string[] };
  printedClaims: string[];
  madeIn: string | null;
  bottle: string | null;
  packaging: string | null;
  otherText: string[];
  legibility: "clear" | "partial" | "unreadable";
}

export interface ProductCopy {
  caption: string;
  description: string;
  category: string | null;
  notes: { top: string[]; heart: string[]; base: string[] };
  notesSource: "carton" | "knowledge" | "none";
}

function parseJson(input: string): any {
  // Some reasoning models print their thinking before the answer.
  const raw = input.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  try {
    return JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("AI returned something that was not JSON");
  }
}

const list = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean).slice(0, 12) : [];
const str = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t && t.toLowerCase() !== "null" ? t : null;
};

const EXTRACT_SYSTEM = `You are reading a photo of perfume packaging (a carton, box, bottle or label) for a shop's catalogue.
Your only job is to TRANSCRIBE what is visible. Do not describe how it smells, do not guess, do not fill gaps from memory.
Return ONLY a JSON object with exactly these keys:
{
  "brand": string | null,
  "productName": string | null,        // the fragrance's own name, without the brand or the concentration
  "line": string | null,               // collection or line if printed, e.g. "Intense", "Noir"
  "concentration": string | null,      // exactly as printed or clearly abbreviated: Eau de Parfum, Eau de Toilette, Parfum, Extrait de Parfum, Cologne, Attar, Body Spray, Body Mist
  "volumesMl": number[],               // every bottle volume printed, in ml, e.g. [100] or [50, 100]. Convert fl oz to ml only if ml is not printed.
  "targetGender": "men" | "women" | "unisex" | null,   // from "pour homme", "for her", "for men", etc. null if not stated
  "printedNotes": { "top": string[], "heart": string[], "base": string[] },   // ONLY notes literally printed on the pack. Empty arrays if none.
  "printedClaims": string[],           // other printed words worth keeping, e.g. "long lasting", "Made in Dubai", "Vaporisateur"
  "madeIn": string | null,
  "bottle": string | null,             // what you can SEE: glass colour, liquid colour, shape, cap material and colour, any engraving
  "packaging": string | null,          // what you can SEE of the box: colour, finish, foil, window, pattern
  "otherText": string[],               // other legible text lines
  "legibility": "clear" | "partial" | "unreadable"
}
If the name or brand is not readable, use null and set legibility to "partial" or "unreadable". Never invent a value.`;

export async function extractPackagingFacts(imageUrls: string[]): Promise<PackagingFacts> {
  const ask = "Read the packaging in this photo and return the JSON.";
  let raw: string;
  try {
    raw = await callGroqVision(
      [
        { role: "system", content: EXTRACT_SYSTEM },
        {
          role: "user",
          content: [
            { type: "text", text: ask },
            ...imageUrls.slice(0, 4).map((url) => ({ type: "image_url" as const, image_url: { url } })),
          ],
        },
      ],
      { json: true, temperature: 0.1 }
    );
  } catch (groqErr) {
    // No usable vision model on the Groq account: use Gemini if a key is set.
    if (!process.env.GEMINI_API_KEY) throw groqErr;
    raw = await callGeminiVision(EXTRACT_SYSTEM, ask, imageUrls, 0.1);
  }
  const p = parseJson(raw);
  const gender = str(p.targetGender)?.toLowerCase();
  const nums: number[] = Array.isArray(p.volumesMl)
    ? p.volumesMl.map((n: unknown) => Math.round(Number(n))).filter((n: number) => n > 0 && n <= 1000)
    : [];
  return {
    brand: str(p.brand),
    productName: str(p.productName),
    line: str(p.line),
    concentration: str(p.concentration),
    volumesMl: Array.from(new Set(nums)).sort((a, b) => a - b),
    targetGender: gender === "men" || gender === "women" || gender === "unisex" ? gender : null,
    printedNotes: {
      top: list(p.printedNotes?.top),
      heart: list(p.printedNotes?.heart),
      base: list(p.printedNotes?.base),
    },
    printedClaims: list(p.printedClaims),
    madeIn: str(p.madeIn),
    bottle: str(p.bottle),
    packaging: str(p.packaging),
    otherText: list(p.otherText),
    legibility: p.legibility === "clear" || p.legibility === "unreadable" ? p.legibility : "partial",
  };
}

const WRITER_SYSTEM = `You write the catalogue copy for Royal Fragrance, a luxury perfume shop in Nigeria.
You receive FACTS read from the product's own packaging. Write copy that a knowledgeable fragrance consultant would be proud of: specific, accurate, and useful to someone deciding whether to buy.

Return ONLY a JSON object:
{
  "caption": string,
  "description": string,
  "category": string | null,
  "notes": { "top": string[], "heart": string[], "base": string[] },
  "notesSource": "carton" | "knowledge" | "none"
}

CAPTION (shown on product cards): one line, at most 100 characters. It must carry at least two concrete specifics, such as the scent family or the leading notes, the concentration, and who or what occasion it suits. Good: "Smoky oud and warm amber in a rich Eau de Parfum for cool evenings". Bad: "A luxurious fragrance for the modern individual".

DESCRIPTION (product page): short and precise, 40 to 60 words in total, one paragraph, no bullet points, no headings. Every sentence must carry information; cut anything decorative.
1. First sentence: the fragrance, brand, concentration and size or sizes, plus its scent family.
2. Second sentence: the key notes and how they feel, naming the notes. Skip this detail if no notes are known.
3. Last sentence: who it suits and when to wear it (time of day, season or occasion). Mention the bottle or box only if something about it is genuinely striking, and then in a few words.

NOTES RULES (most important):
- If the facts include printedNotes, use exactly those and set notesSource to "carton".
- If no notes are printed but you are CERTAIN of the widely published official note pyramid for this exact fragrance (same brand, same name), you may use it and set notesSource to "knowledge".
- Otherwise leave notes empty, set notesSource to "none", and describe only the scent family that the name, line or gender strongly implies, without naming specific notes.
- Never invent notes. Never state longevity in hours, never claim authenticity, awards, celebrity links or "best seller".

STYLE: confident, warm and precise. Do not use these words or phrases: elevate, unleash, symphony, journey, captivating, mesmerizing, allure, testament, timeless, must-have, perfect for any occasion, indulge, embrace, sophisticated individual. No emojis. No exclamation marks. Do not repeat the caption inside the description. Do not start two sentences with the same word. Never go over 60 words in the description.

CATEGORY: choose exactly one name from "Available categories" that best fits (usually by gender or style). Use null if none fit.`;

export async function writeProductCopy(input: {
  facts: PackagingFacts;
  displayName: string;
  availableCategories: string[];
  hints?: string;
}): Promise<ProductCopy> {
  const payload = {
    name: input.displayName,
    facts: input.facts,
    extraNotesFromAdmin: input.hints || null,
  };
  const raw = await callGroq(
    [
      { role: "system", content: WRITER_SYSTEM },
      {
        role: "user",
        content: `FACTS:\n${JSON.stringify(payload, null, 2)}\n\nAvailable categories: ${
          input.availableCategories.join(", ") || "(none)"
        }\n\nWrite the JSON now.`,
      },
    ],
    { json: true, temperature: 0.55 }
  );
  const p = parseJson(raw);
  const category =
    typeof p.category === "string" && input.availableCategories.includes(p.category) ? p.category : null;
  const notes = {
    top: list(p.notes?.top),
    heart: list(p.notes?.heart),
    base: list(p.notes?.base),
  };
  const hasNotes = notes.top.length + notes.heart.length + notes.base.length > 0;
  let notesSource: ProductCopy["notesSource"] =
    p.notesSource === "carton" || p.notesSource === "knowledge" ? p.notesSource : "none";
  if (!hasNotes) notesSource = "none";
  return {
    caption: String(p.caption ?? "").trim().slice(0, 140),
    description: String(p.description ?? "").trim(),
    category,
    notes,
    notesSource,
  };
}

/** "Dior" + "Sauvage" -> "Dior Sauvage", without doubling the brand. */
export function displayNameFrom(facts: PackagingFacts, fallback = ""): string {
  const parts = [facts.brand, facts.productName, facts.line].filter(Boolean) as string[];
  const out: string[] = [];
  for (const part of parts) {
    if (!out.join(" ").toLowerCase().includes(part.toLowerCase())) out.push(part);
  }
  return out.join(" ").trim() || fallback;
}
