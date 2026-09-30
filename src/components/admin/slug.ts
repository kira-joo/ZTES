/**
 * Auto-slug helpers for the "generate from name" button on product, category,
 * brand, page and post forms. Mirrors the server's own slug validation
 * (`LocalizedSlugDto` in `src/server/core/dto/common.dto.ts`) exactly, so a
 * generated slug never fails validation on submit.
 */

/** English: lowercase ASCII letters/digits, single hyphens. Strips Latin diacritics rather than dropping the letter entirely. */
export function slugifyEnglish(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Arabic (or any Unicode script): keeps letters/numbers, single hyphens elsewhere. No case folding — Arabic has none. */
export function slugifyLocalized(input: string): string {
  return input
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}
