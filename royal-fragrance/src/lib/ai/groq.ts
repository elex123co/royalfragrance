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

const FALLBACK_VISION_MODEL = "meta-llama/llama-4-maverick-17b-128e-instruct";

export async function callGroqVision(
  messages: VisionMessage[],
  { json = false, temperature = 0.7 }: { json?: boolean; temperature?: number } = {}
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");

  const primary = process.env.GROQ_VISION_MODEL || DEFAULT_VISION_MODEL;
  // If Groq rejects the request itself (unknown model, JSON mode not allowed
  // with images), retry with a plainer request and a second vision model.
  const attempts: { model: string; json: boolean }[] = [
    { model: primary, json },
    ...(json ? [{ model: primary, json: false }] : []),
    ...(primary !== FALLBACK_VISION_MODEL ? [{ model: FALLBACK_VISION_MODEL, json: false }] : []),
  ];

  let lastError = "";
  for (const attempt of attempts) {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: attempt.model,
        messages,
        temperature,
        ...(attempt.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? "";
    }
    const text = await res.text();
    lastError = `Groq vision request failed (${res.status}, ${attempt.model}): ${text.slice(0, 300)}`;
    // Bad key or rate limit will not be fixed by another model.
    if (res.status === 401 || res.status === 403 || res.status === 429) break;
  }
  throw new Error(lastError);
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
