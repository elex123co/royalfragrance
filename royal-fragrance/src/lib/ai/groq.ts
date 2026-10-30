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

export async function callGroqVision(
  messages: VisionMessage[],
  { json = false, temperature = 0.7 }: { json?: boolean; temperature?: number } = {}
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.GROQ_VISION_MODEL || DEFAULT_VISION_MODEL,
      messages,
      temperature,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq vision request failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
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
