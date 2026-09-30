import { extractLocaleFromUrl, extractSallaIdFromUrl, deepUnsliceStrings } from "../lib/html-utils";

export interface SitemapUrlPair {
  id: string;
  ar: string | null;
  en: string | null;
}

/** Every `<loc>` in one sitemap XML document, in document order. */
function _parseSitemapLocs(xml: string): string[] {
  const locs: string[] = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml))) locs.push(match[1]!);
  return locs;
}

/**
 * Groups a flat list of sitemap URLs (which alternate ar/en for the same
 * entity) into one record per numeric id, keyed by `kind`. A URL that
 * matches none of the known id patterns (the homepage, the `/p/<slug>`
 * static-page aliases) is returned separately as `other`.
 */
export function groupSitemapUrlsById(
  locs: string[],
  kind: "category" | "product" | "post"
): { pairs: SitemapUrlPair[]; other: string[] } {
  const byId = new Map<string, SitemapUrlPair>();
  const other: string[] = [];

  for (const loc of locs) {
    const parsed = extractSallaIdFromUrl(loc);
    const locale = extractLocaleFromUrl(loc);
    if (!parsed || parsed.kind !== kind || !locale) {
      other.push(loc);
      continue;
    }
    const existing = byId.get(parsed.id) ?? { id: parsed.id, ar: null, en: null };
    existing[locale] = loc;
    byId.set(parsed.id, existing);
  }

  return { pairs: [...byId.values()], other };
}

/** The 7 static `/ar|en/p/<slug>` pages, paired by their (identical) slug. */
export function extractStaticPageUrls(locs: string[]): { ar: string; en: string | null }[] {
  const arPages = locs.filter((loc) => /^https?:\/\/[^/]+\/ar\/p\//.test(loc));
  const enPages = new Map(
    locs.filter((loc) => /^https?:\/\/[^/]+\/en\/p\//.test(loc)).map((loc) => [decodeURIComponent(loc.split("/en/p/")[1] ?? ""), loc])
  );

  return arPages.map((arLoc) => {
    const slug = decodeURIComponent(arLoc.split("/ar/p/")[1] ?? "");
    return { ar: arLoc, en: enPages.get(slug) ?? null };
  });
}

export function parseSitemapLocs(xml: string): string[] {
  return deepUnsliceStrings(_parseSitemapLocs(xml));
}
