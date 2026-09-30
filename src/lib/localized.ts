import { resolveLocalized, type LocalizedString } from "@kira-joo/toolkit-common";

/**
 * Store content in the viewer's language, falling back to the other language
 * when a translation is missing (the toolkit's rule), then to "".
 */
export function pickLocalized(value: LocalizedString | null | undefined, locale: string): string {
  return resolveLocalized(value ?? null, locale === "en" ? "en" : "ar");
}

/** The slug for a locale (each locale has its own). */
export function pickSlug(slug: { ar: string; en: string } | null | undefined, locale: string): string {
  if (!slug) return "";
  return locale === "en" ? slug.en || slug.ar : slug.ar || slug.en;
}
