export type Vars = Record<string, string | number | boolean | null | undefined>;
function fill(v: string | number | boolean | null | undefined) {
  return v === null || v === undefined || typeof v === "boolean" ? "" : String(v);
}

export type TFn = (key: string, a?: string | Vars, b?: Vars) => string;

/**
 * Returns the admin's edited wording for `key`, or the original text.
 * t(key) uses the original from the registry; t(key, "original", vars?) carries
 * the original inline. {name} placeholders are filled from vars.
 */
export function makeTranslator(
  overrides: Record<string, string>,
  defaults: Record<string, string> = {}
): TFn {
  return (key, a, b) => {
    const def = typeof a === "string" ? a : defaults[key] ?? "";
    const vars = typeof a === "string" ? b : a;
    const raw = overrides[key] ?? def;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? fill(vars[name]) : m));
  };
}

/** Readable key for wording that lives in a list or map rather than in the markup. */
export function slugText(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 48);
}

/** Translates a piece of wording that is stored as plain data (menu labels, status names). */
export function tl(t: TFn, scope: string, text: string) {
  return t(`${scope}.${slugText(text)}`, text);
}
