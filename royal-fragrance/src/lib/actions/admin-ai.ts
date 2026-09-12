"use server";

import { requireAdmin } from "./require-admin";
import { callGroq } from "@/lib/ai/groq";

export interface GenerateDescriptionInput {
  name: string;
  availableCategories: string[]; // real category names to choose from — never invents one
  hints?: string; // optional freeform notes, e.g. "woody, vanilla, unisex"
}

export interface GenerateDescriptionResult {
  success: boolean;
  shortDescription?: string;
  description?: string;
  suggestedCategory?: string; // exact match to one of availableCategories, or undefined
  error?: string;
}

export async function generateProductDescription(
  input: GenerateDescriptionInput
): Promise<GenerateDescriptionResult> {
  await requireAdmin();

  if (!input.name.trim()) {
    return { success: false, error: "Enter a product name first." };
  }

  try {
    const raw = await callGroq(
      [
        {
          role: "system",
          content: `You write premium, sensory product copy for Royal Fragrance, a luxury perfume brand.
Tone: elegant, evocative, confident — never generic or salesy. Return ONLY a JSON object:
{ "shortDescription": string, "description": string, "suggestedCategory": string | null }
shortDescription: one punchy sentence, under 90 characters, for product cards.
description: 2-3 sentences for the full product page — richer, sensory, but never inventing specific notes/ingredients you weren't given.
suggestedCategory: pick the single best-fitting category EXACTLY as written from the "Available categories" list based on the product name and any notes given. If genuinely nothing fits, use null — never invent a category not in the list.`,
        },
        {
          role: "user",
          content: `Product name: ${input.name}
Available categories: ${input.availableCategories.join(", ") || "(none set up yet)"}
${input.hints ? `Notes/context to weave in: ${input.hints}` : "No specific notes given — keep it evocative but generic about the scent itself."}`,
        },
      ],
      { json: true }
    );

    const parsed = JSON.parse(raw);
    const suggestedCategory =
      typeof parsed.suggestedCategory === "string" &&
      input.availableCategories.includes(parsed.suggestedCategory)
        ? parsed.suggestedCategory
        : undefined;

    return {
      success: true,
      shortDescription: parsed.shortDescription,
      description: parsed.description,
      suggestedCategory,
    };
  } catch (err) {
    console.error("AI description generation failed:", err);
    return { success: false, error: "Could not generate right now. Please try again." };
  }
}
