import { callGroq } from "../ai/groq";
import { CONTENT_TYPE_LABELS, type ContentDecision, type DecisionContext, type GeneratedNewsletter } from "./types";

const ELIZABETH_PERSONA = `You are Elizabeth, the recurring voice and personality of Royal Fragrance,
a premium fragrance brand. You write the brand's newsletter three times a week.

Your personality: warm, intelligent, playful, sophisticated, curious, occasionally
dramatic, naturally funny, culturally relatable to a Nigerian audience without
leaning on heavy slang. You are passionate about fragrance. You sound human and
familiar, but you never claim to literally be a human — you're the AI personality
of Royal Fragrance, and that's part of your charm, not something to hide.

Rules you always follow:
- Never invent a product name, price, or claim that isn't given to you explicitly.
- A newsletter does not need to sell anything. Entertainment and connection are
  successes on their own.
- If you reference a product, it must come only from the "REAL PRODUCTS YOU MAY MENTION"
  list you're given — never any other name.
- Keep Nigerian humor warm, relatable, and premium — never a meme-page tone.
- Sunday reflection should be thoughtful and calm without assuming any one religion.
- Sign off in your own recognizable but slightly varying voice, e.g.
  "Until next time, Elizabeth 👑" — vary the exact wording newsletter to newsletter.`;

function buildRecentSummary(context: DecisionContext): string {
  if (context.recentNewsletters.length === 0) return "(No newsletters sent yet — this is the first.)";
  return context.recentNewsletters
    .slice(0, 5)
    .map((n) => `- [${n.content_type}] "${n.title}"`)
    .join("\n");
}

export async function generateNewsletter(
  context: DecisionContext,
  decision: ContentDecision
): Promise<GeneratedNewsletter> {
  const productList =
    context.featuredProducts.length > 0
      ? context.featuredProducts
          .map((p) => `- ${p.name} (${p.category}, ₦${p.price.toLocaleString()}) — ${p.shortDescription}`)
          .join("\n")
      : "(No specific products are featured this cycle — you may write without one, or reference the shop generally without naming a specific product.)";

  const storylineBrief =
    decision.storylineAction === "continue" && context.activeStoryline
      ? `You are CONTINUING an existing storyline: "${context.activeStoryline.title}" (Episode ${context.activeStoryline.current_episode}).
Summary so far: ${context.activeStoryline.summary}
Characters: ${context.activeStoryline.characters.map((c) => `${c.name} (${c.personality ?? "personality not yet defined"})`).join(", ") || "none defined yet"}
Write Episode ${context.activeStoryline.current_episode + 1}. You may end on a cliffhanger or wrap a small arc — your choice.`
      : decision.storylineAction === "start_new"
        ? `Start a BRAND NEW "Royal Scent Chronicles" storyline. Invent a title, at least one named character, and Episode 1. This can run across future newsletters.`
        : "";

  const voteRecap = context.pendingVoteResult
    ? `In your last interactive newsletter you asked: "${context.pendingVoteResult.question}". Customers voted, and the winning choice was "${context.pendingVoteResult.winningChoice}". Acknowledge this naturally if it fits (e.g. "you all chose...").`
    : "";

  const interactiveInstruction = decision.makeInteractive
    ? `End with an interactive choice for readers — 2 to 3 short options (e.g. A/B/C) that would meaningfully continue the story or theme next time. Return them in interactiveChoices.`
    : "";

  const schema = `Return ONLY a JSON object with this exact shape, no other text:
{
  "title": string,
  "subject": string,
  "previewText": string,
  "content": string,               // full newsletter body as clean HTML (paragraphs in <p> tags, no <html>/<body> wrapper)
  "tone": string,                  // 2-4 words describing the tone used
  "storylineTitle": string | null, // ONLY set if starting a brand new storyline
  "storylineSummaryUpdate": string | null, // 1-3 sentence updated recap for continuity, if this is a storyline episode
  "isCliffhanger": boolean,
  "featuredProductNames": string[], // exact names from the real product list, only if naturally referenced
  "interactiveQuestion": string | null,
  "interactiveChoices": [{ "key": string, "label": string }] | null
}`;

  const raw = await callGroq(
    [
      { role: "system", content: ELIZABETH_PERSONA },
      {
        role: "user",
        content: `Write today's newsletter.

Day: ${context.dayOfWeek} — ${decision.dayPurposeHint}
Content format: ${CONTENT_TYPE_LABELS[decision.contentType]}

Newsletters sent recently (avoid repeating jokes, premises, or near-identical structure):
${buildRecentSummary(context)}

${storylineBrief}

${voteRecap}

${interactiveInstruction}

REAL PRODUCTS YOU MAY MENTION (never invent others):
${productList}

${context.brandNotes ? `Current brand guidance from the team: ${context.brandNotes}` : ""}

${schema}`,
      },
    ],
    { json: true }
  );

  const parsed = JSON.parse(raw);
  return {
    title: parsed.title,
    subject: parsed.subject,
    previewText: parsed.previewText,
    content: parsed.content,
    tone: parsed.tone ?? "warm",
    storylineTitle: parsed.storylineTitle ?? undefined,
    storylineSummaryUpdate: parsed.storylineSummaryUpdate ?? undefined,
    isCliffhanger: !!parsed.isCliffhanger,
    featuredProductNames: Array.isArray(parsed.featuredProductNames) ? parsed.featuredProductNames : [],
    interactiveQuestion: parsed.interactiveQuestion ?? undefined,
    interactiveChoices: Array.isArray(parsed.interactiveChoices) ? parsed.interactiveChoices : undefined,
  };
}
