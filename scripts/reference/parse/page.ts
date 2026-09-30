import { extractBalancedTag, extractIdFromPath, deepUnsliceStrings } from "../lib/html-utils";

export interface ParsedStaticPage {
  sallaId: string | null;
  title: string;
  /** Raw HTML of `.content-entry` — sanitised at seed time, never here. */
  bodyHtml: string;
}

/**
 * A static "page" (`/p/<slug>` sitemap alias, canonical `/page-<id>`). The
 * theme renders the title in the `.nav-header h1` and the body in
 * `.content-entry` (a Quill/Salla WYSIWYG dump) — confirmed against the
 * "من نحن" and "سياسة الاستخدام الآمن..." pages. A page with no dedicated
 * body block yields an empty `bodyHtml`; the caller decides whether that's
 * acceptable (see `report.json` warnings).
 */
function _parseStaticPage(html: string): ParsedStaticPage {
  const titleMatch = /<h1[^>]*>([^<]*)<\/h1>/.exec(html);

  const marker = 'class="content-entry">';
  const markerIndex = html.indexOf(marker);
  const bodyHtml = markerIndex === -1 ? "" : (extractBalancedTag(html, markerIndex + marker.length, "div") ?? "").trim();

  const idMatch = /\/page-(\d+)/.exec(html);

  return {
    sallaId: idMatch ? idMatch[1]! : null,
    title: (titleMatch?.[1] ?? "").trim(),
    bodyHtml,
  };
}

export function extractPageIdFromHref(href: string): string | null {
  return extractIdFromPath(href, /\/page-(\d+)/);
}

export function parseStaticPage(html: string): ParsedStaticPage {
  return deepUnsliceStrings(_parseStaticPage(html));
}
