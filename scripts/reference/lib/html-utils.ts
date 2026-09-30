/**
 * Pure, DOM-independent helpers shared by every `parse/*.ts` module. Kept
 * framework-free (plain regex/string scanning) so they're trivial to unit
 * test against small saved fragments.
 */

/** Decodes the small set of HTML entities the reference actually emits in attribute text. */
export function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

/** Every `<meta property="..." content="...">` / `<meta name="..." content="...">` tag, last-write-wins per key. */
export function extractMetaTags(html: string): Record<string, string> {
  const tags: Record<string, string> = {};
  const re = /<meta\s+(?:property|name)="([^"]+)"\s+content="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    tags[match[1]!] = decodeHtmlEntities(match[2]!);
  }
  return tags;
}

/** Every `<script type="application/ld+json">` block on the page, parsed. Invalid JSON is skipped. */
export function extractJsonLd(html: string): unknown[] {
  const blocks: unknown[] = [];
  const re = /<script type="application\/ld\+json">(.*?)<\/script>/gs;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    try {
      blocks.push(JSON.parse(match[1]!));
    } catch {
      // Skip a malformed block rather than aborting the whole page.
    }
  }
  return blocks;
}

/** Flattens every `@graph` array across a page's ld+json blocks, keeping bare (non-graph) nodes too. */
export function extractJsonLdGraphNodes(html: string): Record<string, unknown>[] {
  const nodes: Record<string, unknown>[] = [];
  for (const block of extractJsonLd(html)) {
    if (block && typeof block === "object") {
      const graph = (block as Record<string, unknown>)["@graph"];
      if (Array.isArray(graph)) {
        for (const node of graph) if (node && typeof node === "object") nodes.push(node as Record<string, unknown>);
      } else {
        nodes.push(block as Record<string, unknown>);
      }
    }
  }
  return nodes;
}

/**
 * Forces a genuinely independent copy of a string slice.
 *
 * `str.slice(a, b)` on a large string can return a V8 "sliced string" that
 * internally still points at the FULL original buffer — a 9KB description
 * sliced out of a 1.1MB product page can keep that whole 1.1MB page alive for
 * as long as the small slice is referenced. Measured on this scraper: ~2.2MB
 * retained per product (≈ one full cached page) even though each product's
 * final JSON footprint is ~11KB — 1242 products reached a 4GB heap and
 * crashed with `JavaScript heap out of memory` before this existed.
 *
 * String concatenation forces V8 to materialise a flat copy rather than a
 * view over the parent, which is the standard workaround for this class of
 * leak (see V8's "sliced string" / "cons string" internals).
 */
function unsliceString(value: string): string {
  return (" " + value).slice(1);
}

/**
 * Applies {@link unsliceString} to every string anywhere inside a parsed
 * result, recursively. The actual leak this closes is regex CAPTURING
 * GROUPS, not `.slice()` — `RegExp.exec()` on a large subject can hand back
 * a group that is a sliced view into that subject, and something as
 * innocuous as `decodeHtmlEntities` returning its input unchanged (no
 * entities to decode) passes that view straight through into the returned
 * object. Every `parseXxx()` in this directory calls this on its result
 * before returning, so the fix lives in one place rather than at every
 * regex call site across seven parser files.
 */
export function deepUnsliceStrings<T>(value: T): T {
  if (typeof value === "string") return unsliceString(value) as T;
  if (Array.isArray(value)) return value.map((item) => deepUnsliceStrings(item)) as T;
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) result[key] = deepUnsliceStrings(item);
    return result as T;
  }
  return value;
}

/**
 * Extracts one balanced `{...}` JSON value starting at the first `{` at or
 * after `searchFrom`, tracking string/escape state so a brace inside a
 * quoted string never miscounts. Returns `null` if unbalanced.
 */
export function extractBalancedJson(html: string, searchFrom: number): { raw: string; endIndex: number } | null {
  const start = html.indexOf("{", searchFrom);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < html.length; i++) {
    const char = html[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth++;
    else if (char === "}") {
      depth--;
      if (depth === 0) return { raw: unsliceString(html.slice(start, i + 1)), endIndex: i + 1 };
    }
  }
  return null;
}

/**
 * The embedded `salla.event.dispatchEvents({"twilight::init":{"store": {...
 * }}})` blob present on every rendered page (product, category, brand,
 * static page, home). It is the only place this SSR theme exposes store
 * identity/contact/social/tax data as structured JSON rather than scattered
 * DOM text, so every parser that needs store-level facts reads it from here.
 */
export function extractStoreConfig(html: string): Record<string, unknown> | null {
  const marker = '"twilight::init":{"store":';
  const markerIndex = html.indexOf(marker);
  if (markerIndex === -1) return null;
  const extracted = extractBalancedJson(html, markerIndex + marker.length - 1);
  if (!extracted) return null;
  try {
    return JSON.parse(extracted.raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Given `startIndex` immediately after the `>` of an already-opened
 * `<tagName ...>`, scans forward tracking nested opens/closes of the same
 * tag and returns the inner HTML up to (not including) the matching close.
 * Used instead of a fixed-depth regex wherever a content block's own nesting
 * depth is not guaranteed (a WYSIWYG dump can embed anything).
 */
export function extractBalancedTag(html: string, startIndex: number, tagName: string): string | null {
  const openRe = new RegExp(`<${tagName}(?:\\s[^>]*)?>`, "gi");
  const closeRe = new RegExp(`</${tagName}>`, "gi");
  let depth = 1;
  let cursor = startIndex;

  while (depth > 0) {
    openRe.lastIndex = cursor;
    closeRe.lastIndex = cursor;
    const openMatch = openRe.exec(html);
    const closeMatch = closeRe.exec(html);
    if (!closeMatch) return null;

    if (openMatch && openMatch.index < closeMatch.index) {
      depth++;
      cursor = openMatch.index + openMatch[0].length;
    } else {
      depth--;
      if (depth === 0) return unsliceString(html.slice(startIndex, closeMatch.index));
      cursor = closeMatch.index + closeMatch[0].length;
    }
  }
  return null;
}

/** Strips tags for a plain-text fallback (e.g. deriving an excerpt). Not a substitute for `sanitizeRichText`. */
export function stripTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Splits a Salla `aria-label="Arabic | English"` brand label. Falls back to
 * using the single value for both locales when there is no `|` separator
 * (several brand names on the reference are Latin-only with no Arabic side).
 */
export function splitBilingualLabel(label: string): { ar: string; en: string } {
  const parts = label.split("|").map((part) => part.trim());
  if (parts.length >= 2 && parts[0] && parts[1]) {
    // Heuristic: whichever side contains an Arabic letter is the AR side.
    const hasArabic = (value: string): boolean => /[؀-ۿ]/.test(value);
    const [first, second] = parts;
    if (hasArabic(first!) && !hasArabic(second!)) return { ar: first!, en: second! };
    if (!hasArabic(first!) && hasArabic(second!)) return { ar: second!, en: first! };
    return { ar: first!, en: second! };
  }
  return { ar: label.trim(), en: label.trim() };
}

/** Extracts the numeric id suffix from a Salla path segment like `c1234`, `p1234`, `brand-1234`, `page-1234`, `a-1234`. */
export function extractIdFromPath(pathname: string, prefix: RegExp): string | null {
  const match = prefix.exec(pathname);
  return match ? match[1]! : null;
}

/** The last path segment's trailing numeric id for any of `c`, `p`, `brand-`, `page-`, `a-`. */
export function extractSallaIdFromUrl(url: string): { kind: "category" | "product" | "brand" | "page" | "post"; id: string } | null {
  const pathname = (() => {
    try {
      return decodeURIComponent(new URL(url).pathname);
    } catch {
      return url;
    }
  })();

  const patterns: [RegExp, "category" | "product" | "brand" | "page" | "post"][] = [
    [/\/c(\d+)(?:$|\/)/, "category"],
    [/\/p(\d+)(?:$|\/)/, "product"],
    [/\/brand-(\d+)(?:$|\/)/, "brand"],
    [/\/page-(\d+)(?:$|\/)/, "page"],
    [/\/a-(\d+)(?:$|\/)/, "post"],
  ];
  for (const [pattern, kind] of patterns) {
    const match = pattern.exec(pathname);
    if (match) return { kind, id: match[1]! };
  }
  return null;
}

/** The locale-tagged first path segment (`ar`/`en`) of a reference URL. */
export function extractLocaleFromUrl(url: string): "ar" | "en" | null {
  const match = /^https?:\/\/[^/]+\/(ar|en)(?:\/|$)/.exec(url);
  return match ? (match[1] as "ar" | "en") : null;
}

/** The final path segment before the trailing `c<id>`/`p<id>`/... — i.e. the URL slug. */
export function extractSlugFromUrl(url: string): string {
  try {
    const { pathname } = new URL(url);
    const segments = decodeURIComponent(pathname).split("/").filter(Boolean);
    // [locale, ...slugSegments, "cNNN" | "pNNN" | ...] — drop locale and the id segment.
    const withoutLocale = segments.slice(1);
    const withoutId = withoutLocale.slice(0, -1);
    return withoutId.join("/").toLowerCase();
  } catch {
    return "";
  }
}
