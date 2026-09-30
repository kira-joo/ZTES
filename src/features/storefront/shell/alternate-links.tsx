"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Each record has its own slug per locale (`/ar/products/جل-ادفيون` ↔
 * `/en/products/gel-advion`), so "switch language" cannot just swap the
 * prefix. A page that knows its counterpart registers it here; the language
 * switcher follows it, falling back to the same path otherwise.
 */
export type AlternatePaths = { ar: string; en: string };

const Context = createContext<{ paths: AlternatePaths | null; set: (paths: AlternatePaths | null) => void } | null>(null);

export function AlternateLinksProvider({ children }: { children: ReactNode }) {
  const [paths, set] = useState<AlternatePaths | null>(null);
  return <Context.Provider value={{ paths, set }}>{children}</Context.Provider>;
}

export function useAlternatePaths(): AlternatePaths | null {
  return useContext(Context)?.paths ?? null;
}

/** Render on a page to declare its path in each locale (paths without the locale prefix). */
export function SetAlternatePaths({ ar, en }: AlternatePaths) {
  const context = useContext(Context);
  const set = context?.set;
  useEffect(() => {
    set?.({ ar, en });
    return () => set?.(null);
  }, [ar, en, set]);
  return null;
}
