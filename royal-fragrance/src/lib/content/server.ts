import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { CONTENT_DEFAULTS } from "./registry";

export type TFn = (key: string, vars?: Record<string, string | number>) => string;

const loadOverrides = unstable_cache(
  async (): Promise<Record<string, string>> => {
    try {
      const { data } = await createAdminClient().from("site_content").select("key, value");
      return Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value as string]));
    } catch {
      return {};
    }
  },
  ["site-content"],
  { tags: ["site-content"] }
);

export function makeT(overrides: Record<string, string>): TFn {
  return (key, vars) => {
    const raw = overrides[key] ?? CONTENT_DEFAULTS[key] ?? "";
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m));
  };
}

/** The wording for the site: the admin's edits, falling back to the original text. */
export async function getT(): Promise<TFn> {
  return makeT(await loadOverrides());
}

/** Every override, for the admin editor. Not cached so the editor is always current. */
export async function getOverridesFresh(): Promise<Record<string, string>> {
  const { data } = await createAdminClient().from("site_content").select("key, value");
  return Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value as string]));
}
