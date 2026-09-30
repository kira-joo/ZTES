/**
 * Identity normalisation. Phone and email are the customer's unique keys, so
 * every spelling of one number must land on one string.
 */

const ARABIC_DIGITS = /[٠-٩۰-۹]/g;

function westernDigits(value: string): string {
  return value.replace(ARABIC_DIGITS, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
}

/**
 * Saudi mobile numbers to E.164 (`+9665XXXXXXXX`). Accepts 05XXXXXXXX,
 * 5XXXXXXXX, 9665XXXXXXXX, +9665XXXXXXXX, 009665XXXXXXXX, spaces, dashes and
 * Arabic-Indic digits. Returns null for anything that is not a Saudi mobile.
 */
export function normalizeSaudiMobile(input: string): string | null {
  const digits = westernDigits(input).replace(/[\s\-()]/g, "");
  const match = /^(?:\+?966|00966|0)?(5\d{8})$/.exec(digits);
  return match ? `+966${match[1]}` : null;
}

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

/**
 * Folds Arabic spelling variants so a search for "اسطوانه" finds "أسطوانة":
 * hamza forms of alef → ا, ة → ه, ى → ي, tatweel and diacritics removed.
 */
export function normalizeSearchText(input: string): string {
  return westernDigits(input)
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/**
 * URL slugs that keep Arabic letters (the reference's Arabic URLs do) and
 * lower-case Latin. Anything else becomes a single hyphen.
 */
export function slugify(input: string): string {
  return westernDigits(input)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
