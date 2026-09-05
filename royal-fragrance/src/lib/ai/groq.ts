const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Llama 3.3 70B on Groq — strong instruction-following and JSON-mode
// reliability at very low latency, a good fit for a real-time chat widget.
const MODEL = "llama-3.3-70b-versatile";

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
      model: MODEL,
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
