import { parse } from "node-html-parser";
import { extractMetaTags, splitBilingualLabel, deepUnsliceStrings } from "../lib/html-utils";

export interface BrandIndexEntry {
  sallaId: string;
  /** The AR-locale canonical URL — the only reliable place to read the AR slug from this listing. */
  href: string;
  name: { ar: string; en: string };
  logoUrl: string | null;
  sortOrder: number;
}

/** The `/ar/brands` index: every brand tile, in document order. */
function _parseBrandIndex(html: string): BrandIndexEntry[] {
  const root = parse(html);
  const links = root.querySelectorAll("a").filter((a) => /\/brand-\d+/.test(a.getAttribute("href") ?? ""));

  const seen = new Set<string>();
  const entries: BrandIndexEntry[] = [];
  let sortOrder = 0;

  for (const a of links) {
    const href = a.getAttribute("href") ?? "";
    const idMatch = /brand-(\d+)/.exec(href);
    if (!idMatch) continue;
    const sallaId = idMatch[1]!;
    if (seen.has(sallaId)) continue; // the alphabet jump-nav repeats no brand ids, but guard anyway
    seen.add(sallaId);

    const label = a.getAttribute("aria-label") ?? "";
    const img = a.querySelector("img");
    const logoUrl = img?.getAttribute("data-src") || img?.getAttribute("src") || null;

    entries.push({ sallaId, href, name: splitBilingualLabel(label), logoUrl, sortOrder: sortOrder++ });
  }

  return entries;
}

export interface ParsedBrandDetail {
  title: string;
  /**
   * Plain text from `<meta name="description">`. The brand detail page's own
   * body has no distinct description block — it's a filtered product
   * listing under the brand's name/logo header, and the meta tag is the only
   * brand-specific prose on the page. `scrape.ts` prefers the richer HTML
   * description embedded in a product's ld+json `brand.description` (when
   * any scraped product references this brand) and falls back to this.
   */
  metaDescription: string;
}

function _parseBrandDetail(html: string): ParsedBrandDetail {
  const meta = extractMetaTags(html);
  const titleMatch = /<title>([^<]*)<\/title>/.exec(html);
  return {
    title: (titleMatch?.[1] ?? "").split(" - ")[0]?.trim() ?? "",
    metaDescription: meta["description"] ?? "",
  };
}

export function parseBrandIndex(html: string): BrandIndexEntry[] {
  return deepUnsliceStrings(_parseBrandIndex(html));
}

export function parseBrandDetail(html: string): ParsedBrandDetail {
  return deepUnsliceStrings(_parseBrandDetail(html));
}
