"use server";

import { requireAdmin } from "./require-admin";
import {
  extractPackagingFacts,
  writeProductCopy,
  displayNameFrom,
  type PackagingFacts,
} from "@/lib/ai/product-copy";

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
  detectedName?: string;
  detectedSizes?: string[];
  notesSource?: "carton" | "knowledge" | "none";
  error?: string;
}

const EMPTY_FACTS: PackagingFacts = {
  brand: null,
  productName: null,
  line: null,
  concentration: null,
  volumesMl: [],
  targetGender: null,
  printedNotes: { top: [], heart: [], base: [] },
  printedClaims: [],
  madeIn: null,
  bottle: null,
  packaging: null,
  otherText: [],
  legibility: "partial",
};

/**
 * Two-step generation: first read the packaging photos (what is printed,
 * what is visible), then write the caption and description strictly from
 * those facts. Falls back to name-only writing if no photo is readable.
 */
export async function generateProductDescription(
  input: GenerateDescriptionInput
): Promise<GenerateDescriptionResult> {
  await requireAdmin();

  const imageUrls = (input.imageUrls ?? []).filter((u) => /^https?:\/\//.test(u)).slice(0, 3);
  if (!input.name.trim() && imageUrls.length === 0) {
    return { success: false, error: "Enter a product name or add a photo first." };
  }

  try {
    let facts: PackagingFacts = { ...EMPTY_FACTS };
    let usedImages = false;

    if (imageUrls.length > 0) {
      try {
        facts = await extractPackagingFacts(imageUrls);
        usedImages = true;
      } catch (visionErr) {
        console.error("Reading packaging failed, continuing with the name only:", visionErr);
      }
    }

    const typedName = input.name.trim();
    const displayName = typedName || displayNameFrom(facts);
    if (!displayName) {
      return {
        success: false,
        error: "I could not read the name from the photos. Type the product name and try again.",
      };
    }
    if (!facts.productName && typedName) facts.productName = typedName;

    const copy = await writeProductCopy({
      facts,
      displayName,
      availableCategories: input.availableCategories,
      hints: input.hints,
    });

    return {
      success: true,
      shortDescription: copy.caption,
      description: copy.description,
      suggestedCategory: copy.category ?? undefined,
      usedImages,
      detectedName: typedName ? undefined : displayName,
      detectedSizes: facts.volumesMl.map((n) => `${n}ml`),
      notesSource: copy.notesSource,
    };
  } catch (err) {
    console.error("AI description generation failed:", err);
    return { success: false, error: "Could not generate right now. Please try again." };
  }
}
