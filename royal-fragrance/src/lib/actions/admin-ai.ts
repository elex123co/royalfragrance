"use server";

import { requireAdmin } from "./require-admin";
import { callGroq } from "@/lib/ai/groq";

export interface GenerateDescriptionInput {
  name: string;
  category: string;
  hints?: string; // optional freeform notes, e.g. "woody, vanilla, unisex"
}

export interface GenerateDescriptionResult {
  success: boolean;
  shortDescription?: string;
  description?: string;
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
{ "shortDescription": string, "description": string }
shortDescription: one punchy sentence, under 90 characters, for product cards.
description: 2-3 sentences for the full product page — richer, sensory, but never inventing specific notes/ingredients you weren't given.`,
        },
        {
          role: "user",
          content: `Product name: ${input.name}
Category: ${input.category || "Fragrance"}
${input.hints ? `Notes/context to weave in: ${input.hints}` : "No specific notes given — keep it evocative but generic about the scent itself."}`,
        },
      ],
      { json: true }
    );

    const parsed = JSON.parse(raw);
    return {
      success: true,
      shortDescription: parsed.shortDescription,
      description: parsed.description,
    };
  } catch (err) {
    console.error("AI description generation failed:", err);
    return { success: false, error: "Could not generate right now. Please try again." };
  }
}
