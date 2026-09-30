import sanitize from "sanitize-html";

/**
 * Rich text is stored sanitised. Imported reference HTML is third-party and
 * admin-authored HTML is rendered to every customer, so both pass through this
 * on write — rendering then never has to trust what it reads.
 */
const OPTIONS: sanitize.IOptions = {
  allowedTags: [
    "p", "br", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li",
    "h2", "h3", "h4", "blockquote", "table", "thead", "tbody", "tr", "th", "td", "hr", "span", "img",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height"],
    "*": ["dir"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    a: sanitize.simpleTransform("a", { rel: "noopener noreferrer" }),
  },
};

export function sanitizeRichText(html: string | null | undefined): string {
  if (!html) return "";
  return sanitize(html, OPTIONS).replace(/&nbsp;/g, " ").trim();
}

export function sanitizeLocalizedRichText(value: { ar?: string; en?: string } | undefined): { ar: string; en: string } {
  return { ar: sanitizeRichText(value?.ar), en: sanitizeRichText(value?.en) };
}

/** Plain text for meta descriptions and search indexing. */
export function htmlToText(html: string | null | undefined): string {
  if (!html) return "";
  return sanitize(html, { allowedTags: [], allowedAttributes: {} }).replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
