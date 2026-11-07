import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { makeTranslator, type TFn } from "./translate";
import { CONTENT_DEFAULTS } from "./registry";

export type { TFn };

const loadOverrides = unstable_cache(
  async (): Promise<Record<string, string>> => {
    const { data, error } = await createAdminClient().from("site_content").select("key, value");
    // Throwing keeps a failed read out of the cache.
    if (error) throw new Error(error.message);
    return Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value as string]));
  },
  ["site-content"],
  { tags: ["site-content"], revalidate: 300 }
);

/** All of the admin's edits, or none if they cannot be read. */
export async function getOverrides(): Promise<Record<string, string>> {
  // Never let a slow or failing database hold up the page: after 3 seconds
  // the site simply shows the original wording.
  try {
    return await Promise.race([
      loadOverrides(),
      new Promise<Record<string, string>>((resolve) => setTimeout(() => resolve({}), 3000)),
    ]);
  } catch {
    return {};
  }
}

export function makeT(overrides: Record<string, string>): TFn {
  return makeTranslator(overrides, CONTENT_DEFAULTS);
}

/** The wording for the site: the admin's edits, falling back to the original text. */
export async function getT(): Promise<TFn> {
  return makeTranslator(await getOverrides(), CONTENT_DEFAULTS);
}

/** Every override, for the admin editor. Not cached so the editor is always current. */
export async function getOverridesFresh(): Promise<Record<string, string>> {
  const { data, error } = await createAdminClient().from("site_content").select("key, value");
  if (error) throw new Error(error.message);
  return Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value as string]));
}
