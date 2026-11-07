"use client";

import { createContext, useContext, useMemo } from "react";
import type { TFn } from "./translate";
import { makeTranslator } from "./translate";

const ContentContext = createContext<Record<string, string>>({});

/** Gives client components the admin's edited wording. */
export function ContentProvider({
  overrides,
  children,
}: {
  overrides: Record<string, string>;
  children: React.ReactNode;
}) {
  return <ContentContext.Provider value={overrides}>{children}</ContentContext.Provider>;
}

/** t(key, original, vars?) for client components. */
export function useT(): TFn {
  const overrides = useContext(ContentContext);
  return useMemo(() => makeTranslator(overrides), [overrides]);
}
