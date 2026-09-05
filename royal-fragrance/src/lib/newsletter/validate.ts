import type { DecisionContext, GeneratedNewsletter } from "./types";

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  sanitized: GeneratedNewsletter;
}

/**
 * Structural, checkable validation — not a claim of perfect AI safety.
 * Confirms required fields exist, strips any product name that isn't in
 * the real list Elizabeth was given (rather than trusting the model not
 * to invent one), and rejects content that's clearly too short/broken to
 * be a real newsletter.
 */
export function validateNewsletter(
  draft: GeneratedNewsletter,
  context: DecisionContext
): ValidationResult {
  if (!draft.title || !draft.subject || !draft.content) {
    return { valid: false, reason: "Missing required fields", sanitized: draft };
  }
  if (draft.content.replace(/<[^>]+>/g, "").trim().length < 80) {
    return { valid: false, reason: "Content too short to be a real newsletter", sanitized: draft };
  }

  const realNames = new Set(context.featuredProducts.map((p) => p.name.toLowerCase()));
  const sanitizedProductNames = (draft.featuredProductNames ?? []).filter((name) =>
    realNames.has(name.toLowerCase())
  );

  // A recent-duplicate guard: if the new title is near-identical to one of
  // the last few sent, treat as invalid rather than silently sending a
  // repeat.
  const isNearDuplicateTitle = context.recentNewsletters
    .slice(0, 5)
    .some((n) => n.title.toLowerCase().trim() === draft.title.toLowerCase().trim());
  if (isNearDuplicateTitle) {
    return { valid: false, reason: "Title duplicates a recent newsletter", sanitized: draft };
  }

  if (draft.interactiveQuestion && (!draft.interactiveChoices || draft.interactiveChoices.length < 2)) {
    return {
      valid: false,
      reason: "Interactive question given without at least 2 valid choices",
      sanitized: draft,
    };
  }

  return {
    valid: true,
    sanitized: { ...draft, featuredProductNames: sanitizedProductNames },
  };
}
