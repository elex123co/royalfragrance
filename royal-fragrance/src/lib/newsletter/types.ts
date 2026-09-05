export type ContentType =
  | "nigerian_humor"
  | "storytelling"
  | "luxury_editorial"
  | "romance"
  | "weekend_energy"
  | "sunday_reflection"
  | "scent_confession"
  | "royal_scent_chronicles";

export const ALL_CONTENT_TYPES: ContentType[] = [
  "nigerian_humor",
  "storytelling",
  "luxury_editorial",
  "romance",
  "weekend_energy",
  "sunday_reflection",
  "scent_confession",
  "royal_scent_chronicles",
];

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  nigerian_humor: "Nigerian Humor 😂",
  storytelling: "Storytelling 📖",
  luxury_editorial: "Luxury Editorial 👑",
  romance: "Romance Story 💌",
  weekend_energy: "Weekend Energy 🔥",
  sunday_reflection: "Sunday Reflection 🌿",
  scent_confession: "Scent Confession 🕵🏽",
  royal_scent_chronicles: "Royal Scent Chronicles 📚",
};

export interface DecisionContext {
  dayOfWeek: "monday" | "friday" | "sunday";
  recentNewsletters: {
    content_type: ContentType;
    title: string;
    content: string;
    generated_at: string;
  }[];
  activeStoryline: {
    id: string;
    title: string;
    summary: string;
    current_episode: number;
    last_updated_at: string;
    characters: { name: string; description: string | null; personality: string | null }[];
  } | null;
  pendingVoteResult: { newsletterId: string; question: string; winningChoice: string } | null;
  featuredProducts: { id: string; name: string; category: string; price: number; shortDescription: string }[];
  excludedProductIds: string[];
  brandNotes: string | null;
}

export interface ContentDecision {
  contentType: ContentType;
  storylineAction: "continue" | "start_new" | "none";
  makeInteractive: boolean;
  dayPurposeHint: string;
}

export interface GeneratedNewsletter {
  title: string;
  subject: string;
  previewText: string;
  content: string; // HTML
  tone: string;
  storylineTitle?: string; // set only when starting a brand new storyline
  storylineSummaryUpdate?: string; // recap to persist for continuity
  isCliffhanger?: boolean;
  featuredProductNames?: string[]; // names as written — cross-checked against real catalog
  interactiveQuestion?: string;
  interactiveChoices?: { key: string; label: string }[];
}
