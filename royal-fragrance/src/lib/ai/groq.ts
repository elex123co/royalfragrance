const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Configurable via env rather than hardcoded — Groq's model catalog
// changes fairly often (deprecations, renames), so a model ID baked into
// the code can go stale without warning. Set GROQ_MODEL in your env to
// whatever currently shows up at https://api.groq.com/openai/v1/models
// for your account if the default below ever 404s.
const DEFAULT_MODEL = "openai/gpt-oss-120b";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

type VisionContent =
  | string
  | ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } })[];

interface VisionMessage {
  role: "system" | "user" | "assistant";
  content: VisionContent;
}

// A vision-capable Groq model, so descriptions can be written from the
// actual product photos. Override with GROQ_VISION_MODEL if it is renamed.
const DEFAULT_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const VISION_NAME_HINT = /(scout|maverick|vision|llava|pixtral|gemma-?3|qwen|-vl\b|\bvl-)/i;

async function tryVision(
  apiKey: string,
  model: string,
  messages: VisionMessage[],
  temperature: number,
  json: boolean
): Promise<{ ok: true; text: string } | { ok: false; status: number; error: string }> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (res.ok) {
    const data = await res.json();
    return { ok: true, text: data.choices?.[0]?.message?.content ?? "" };
  }
  const text = await res.text();
  return { ok: false, status: res.status, error: `(${res.status}, ${model}) ${text.slice(0, 240)}` };
}

let discoveredVisionModel: string | null = null;

export async function callGroqVision(
  messages: VisionMessage[],
  { json = false, temperature = 0.7 }: { json?: boolean; temperature?: number } = {}
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");

  const primary = process.env.GROQ_VISION_MODEL || discoveredVisionModel || DEFAULT_VISION_MODEL;

  // 1. The configured model, with JSON mode and then without.
  const first = await tryVision(apiKey, primary, messages, temperature, json);
  if (first.ok) return first.text;
  if (first.status === 401 || first.status === 403 || first.status === 429) {
    throw new Error(`Groq vision request failed ${first.error}`);
  }
  if (json) {
    const plain = await tryVision(apiKey, primary, messages, temperature, false);
    if (plain.ok) return plain.text;
  }

  // 2. The model may have been renamed or retired. Ask Groq which models this
  //    account can use and try the ones that look vision-capable.
  let available: string[] = [];
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) {
      const data = await res.json();
      available = (data.data ?? []).map((m: any) => String(m.id));
    }
  } catch {
    // fall through to the error below
  }
  const candidates = available.filter((id) => id !== primary && VISION_NAME_HINT.test(id)).slice(0, 4);
  for (const model of candidates) {
    const attempt = await tryVision(apiKey, model, messages, temperature, false);
    if (attempt.ok) {
      discoveredVisionModel = model;
      return attempt.text;
    }
  }

  throw new Error(
    `Groq vision request failed ${first.error}. ` +
      (available.length
        ? `Models on this account: ${available.slice(0, 20).join(", ")}. Set GROQ_VISION_MODEL to a vision model from this list.`
        : "Could not list the models on this account.")
  );
}

/**
 * Calls Groq's chat completions endpoint. When `json` is true, requests
 * strict JSON-mode output — Groq (like OpenAI) will refuse non-JSON output
 * when response_format is set, which is what makes the two-step grounding
 * flow in /api/assistant reliable to parse.
 */
export async function callGroq(
  messages: ChatMessage[],
  { json = false, temperature = 0.7 }: { json?: boolean; temperature?: number } = {}
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || DEFAULT_MODEL,
      messages,
      temperature,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/**
 * Fallback reader for photos when no Groq model on the account can see
 * images. Needs GEMINI_API_KEY; GEMINI_MODEL overrides the default.
 */
export async function callGeminiVision(
  systemPrompt: string,
  userText: string,
  imageUrls: string[],
  temperature = 0.1
): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const parts: any[] = [{ text: userText }];
  for (const url of imageUrls.slice(0, 4)) {
    const img = await fetch(url);
    if (!img.ok) throw new Error(`Could not download the photo (${img.status})`);
    const mime = img.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    parts.push({ inline_data: { mime_type: mime, data: Buffer.from(await img.arrayBuffer()).toString("base64") } });
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts }],
        generationConfig: { temperature, responseMimeType: "application/json" },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini request failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("") ?? "";
}
