const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Configurable via env rather than hardcoded — Groq's model catalog
// changes fairly often (deprecations, renames), so a model ID baked into
// the code can go stale without warning. Set GROQ_MODEL in your env to
// whatever currently shows up at https://api.groq.com/openai/v1/models
// for your account if the default below ever 404s.
const DEFAULT_MODEL = "llama-3.1-8b-instant";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Calls Groq's chat completions endpoint. When `json` is true, requests
 * strict JSON-mode output — Groq (like OpenAI) will refuse non-JSON output
 * when response_format is set, which is what makes the two-step grounding
 * flow in /api/assistant reliable to parse.
 */
export async function callGroq(
  messages: ChatMessage[],
  { json = false }: { json?: boolean } = {}
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
      temperature: 0.7,
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
