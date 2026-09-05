import { ALL_CONTENT_TYPES, type ContentDecision, type ContentType, type DecisionContext } from "./types";

const DAY_HINTS: Record<DecisionContext["dayOfWeek"], string> = {
  monday: "Start-of-week energy — a little lift to open the week.",
  friday: "Weekend is close — playful, anticipatory energy works well.",
  sunday: "Slower, more reflective — but this is a guideline, not a rule.",
};

/**
 * Rule-based variety engine — not a black box. Weights every content type
 * down the more recently it's been used, then picks with weighted
 * randomness. This is the honest, testable version of "avoid repetition
 * and reward diversity" from the spec, without claiming a learned model
 * that isn't actually there.
 */
export function decideContent(context: DecisionContext): ContentDecision {
  const recentTypes = context.recentNewsletters.map((n) => n.content_type);

  const weights = new Map<ContentType, number>();
  for (const type of ALL_CONTENT_TYPES) {
    const lastUsedIndex = recentTypes.indexOf(type);
    const weight = lastUsedIndex === -1 ? 10 : Math.min(10, lastUsedIndex + 1);
    weights.set(type, weight);
  }

  const storylineJustUsed = recentTypes[0] === "royal_scent_chronicles";
  let storylineAction: ContentDecision["storylineAction"] = "none";
  if (context.activeStoryline && !storylineJustUsed && Math.random() < 0.4) {
    storylineAction = "continue";
    weights.set("royal_scent_chronicles", 20);
  } else if (!context.activeStoryline && Math.random() < 0.12) {
    storylineAction = "start_new";
    weights.set("royal_scent_chronicles", 15);
  }

  const totalWeight = [...weights.values()].reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  let chosen: ContentType = ALL_CONTENT_TYPES[0];
  for (const type of ALL_CONTENT_TYPES) {
    roll -= weights.get(type)!;
    if (roll <= 0) {
      chosen = type;
      break;
    }
  }

  const interactiveEligible = ["storytelling", "romance", "royal_scent_chronicles"].includes(chosen);
  const makeInteractive = interactiveEligible && Math.random() < 0.35;

  return {
    contentType: chosen,
    storylineAction: chosen === "royal_scent_chronicles" ? storylineAction : "none",
    makeInteractive,
    dayPurposeHint: DAY_HINTS[context.dayOfWeek],
  };
}
