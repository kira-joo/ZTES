import { decodeHtmlEntities, extractStoreConfig } from "../lib/html-utils";

export interface StoreConfigFacts {
  storeName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  phone: string;
  whatsapp: string;
  email: string;
  social: Record<string, string>;
  vatNumber: string;
  vatCertificateUrl: string | null;
  crNumber: string;
  metaDescription: string;
}

/**
 * Reads the embedded `salla.event.dispatchEvents({"twilight::init":{"store":
 * ...}})` blob present on every page — the one place this theme exposes
 * store identity/contact/social/tax data as real JSON rather than scattered
 * DOM text. Any fetched page works as the source; `scrape.ts` uses the home
 * page.
 */
export function extractStoreConfigFacts(html: string): StoreConfigFacts | null {
  const store = extractStoreConfig(html);
  if (!store) return null;

  const settings = (store["settings"] ?? {}) as Record<string, unknown>;
  const tax = (settings["tax"] ?? {}) as Record<string, unknown>;
  const certificate = (settings["certificate"] ?? {}) as Record<string, unknown>;
  const contacts = (store["contacts"] ?? {}) as Record<string, unknown>;
  const social = (store["social"] ?? {}) as Record<string, string>;
  const meta = (store["meta"] ?? {}) as Record<string, unknown>;

  return {
    storeName: String(store["name"] ?? ""),
    logoUrl: (store["logo"] as string) ?? null,
    faviconUrl: (store["icon"] as string) ?? null,
    phone: String(contacts["mobile"] ?? ""),
    whatsapp: String(contacts["whatsapp"] ?? ""),
    email: String(contacts["email"] ?? ""),
    social,
    vatNumber: String(tax["number"] ?? ""),
    vatCertificateUrl: (tax["certificate"] as string) ?? null,
    crNumber: String(certificate["id"] ?? ""),
    metaDescription: String(meta["description"] ?? ""),
  };
}

/** The scrolling marquee text — identical across every repetition in the DOM, so only the first is kept. */
export function extractAnnouncement(html: string): string | null {
  const match = /class="angel-ad__content[^"]*"[^>]*>\s*([^<]*?)\s*</.exec(html);
  return match ? match[1]!.trim() : null;
}

/**
 * The promo popup's raw injected HTML (`s-block--bundle-html-content`,
 * Salla's "Angel" custom-HTML app block — observed carrying a seasonal
 * Saudi National Day 10%-off popup). Returns the decoded inner `code` string
 * as-is; the caller extracts whatever structured pieces it can and treats
 * the rest as informational only (see the importer report).
 */
export function extractPopupRawHtml(html: string): string | null {
  const match = /component-name="html-content"[^>]*config="([^"]*)"/.exec(html);
  if (!match) return null;
  try {
    const decoded = match[1]!
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&amp;/g, "&");
    const config = JSON.parse(decoded) as { code?: string };
    // `JSON.parse` already resolved every `\"`/`\/`/`\n` escape inside `code`,
    // but the HTML itself was ALSO entity-encoded before being embedded
    // (`&lt;input...&gt;` rather than `<input...>`) — one more decode pass.
    return config.code ? decodeHtmlEntities(config.code) : null;
  } catch {
    return null;
  }
}
