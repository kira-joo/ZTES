/** Route params can arrive percent-encoded (Arabic slugs); decode defensively. */
export function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export const otherLocale = (locale: string): "ar" | "en" => (locale === "ar" ? "en" : "ar");
