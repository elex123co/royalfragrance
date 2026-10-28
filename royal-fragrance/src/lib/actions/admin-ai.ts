"use server";

import { requireAdmin } from "./require-admin";
import { callGroq, callGroqVision } from "@/lib/ai/groq";

export interface GenerateDescriptionInput {
  name: string;
  availableCategories: string[]; // real category names to choose from — never invents one
  hints?: string; // optional freeform notes, e.g. "woody, vanilla, unisex"
  imageUrls?: string[]; // uploaded product photos the AI should actually look at
}

export interface GenerateDescriptionResult {
  success: boolean;
  shortDescription?: string;
  description?: string;
  suggestedCategory?: string; // exact match to one of availableCategories, or undefined
  usedImages?: boolean;
  error?: string;
}

const BASE_RULES = `You write premium, sensory product copy for Royal Fragrance, a luxury perfume brand.
Tone: elegant, evocative, confident, never generic or salesy. Return ONLY a JSON object:
{ "shortDescription": string, "description": string, "suggestedCategory": string | null }
shortDescription: one punchy sentence, under 90 characters, for product cards.
description: 2-3 sentences for the full product page. Richer and sensory, but never invent specific notes or ingredients you were not given.
suggestedCategory: pick the single best-fitting category EXACTLY as written from the "Available categories" list based on the product name, the photos and any notes given. If genuinely nothing fits, use null. Never invent a category not in the list.`;

const VISION_RULES = `
You are also given photos of the actual product. Look at them closely and build the copy around what is really visible: the bottle shape and material, the colour of the glass and liquid, the cap and any detailing, the box or packaging, the overall mood and who it seems made for. Mention these visual details naturally. Do not claim scent notes the photos cannot show unless they appear in the notes below.`;

export async function generateProductDescription(
  input: GenerateDescriptionInput
): Promise<GenerateDescriptionResult> {
  await requireAdmin();

  if (!input.name.trim()) {
    return { success: false, error: "Enter a product name first." };
  }

  const imageUrls = (input.imageUrls ?? []).filter((u) => /^https?:\/\//.test(u)).slice(0, 3);

  const userText = `Product name: ${input.name}
Available categories: ${input.availableCategories.join(", ") || "(none set up yet)"}
${input.hints ? `Notes/context to weave in: ${input.hints}` : "No specific scent notes given. Keep the scent itself evocative but general."}`;

  try {
    let raw = "";
    let usedImages = false;

    if (imageUrls.length > 0) {
      try {
        raw = await callGroqVision(
          [
            { role: "system", content: BASE_RULES + VISION_RULES },
            {
              role: "user",
              content: [
                { type: "text", text: userText },
                ...imageUrls.map((url) => ({ type: "image_url" as const, image_url: { url } })),
              ],
            },
          ],
          { json: true }
        );
        usedImages = true;
      } catch (visionErr) {
        // If the vision model is unavailable, fall back to text only rather
        // than failing the whole request.
        console.error("Vision description failed, falling back to text:", visionErr);
      }
    }

    if (!raw) {
      raw = await callGroq(
        [
          { role: "system", content: BASE_RULES },
          { role: "user", content: userText },
        ],
        { json: true }
      );
    }

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
      usedImages,
    };
  } catch (err) {
    console.error("AI description generation failed:", err);
    return { success: false, error: "Could not generate right now. Please try again." };
  }
}
