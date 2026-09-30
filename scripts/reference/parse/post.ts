import { extractBalancedTag, extractMetaTags, deepUnsliceStrings } from "../lib/html-utils";

export interface ParsedBlogPost {
  sallaId: string | null;
  title: string;
  /** The large "hero" line shown above the article body — used as the excerpt. */
  excerpt: string;
  /** Raw HTML of `<article>` — sanitised at seed time, never here. */
  bodyHtml: string;
  coverImageUrl: string | null;
  /** Never found on the reference (no publish-date markup or ld+json field) — always `null`. */
  publishedAt: null;
}

/**
 * A blog ("Pest Library") post, canonical `/blog/<slug>/a-<id>`. AR-only on
 * the reference (the `/en/blog/...` equivalent renders the Arabic content
 * verbatim — same pattern as the AR-only static pages).
 *
 * The excerpt comes from `<meta name="description">`, NOT the big
 * `aria-hidden="true"` heading right above `<article>` — that heading is a
 * purely decorative duplicate of the `<h1>` (confirmed identical text on the
 * "bed bugs" post), not a distinct summary.
 */
function _parseBlogPost(html: string): ParsedBlogPost {
  const titleMatch = /<h1[^>]*>\s*([^<]*?)\s*<\/h1>/.exec(html);
  const excerpt = extractMetaTags(html)["description"] ?? "";
  const coverMatch = /class="post-entry__image[^"]*"[^>]*>\s*<img[^>]*src="([^"]+)"/.exec(html);

  const articleMarker = /<article[^>]*>/.exec(html);
  const bodyHtml = articleMarker
    ? (extractBalancedTag(html, articleMarker.index + articleMarker[0].length, "article") ?? "").trim()
    : "";

  const idMatch = /\/a-(\d+)/.exec(html);

  return {
    sallaId: idMatch ? idMatch[1]! : null,
    title: (titleMatch?.[1] ?? "").trim(),
    excerpt: excerpt.trim(),
    bodyHtml,
    coverImageUrl: coverMatch?.[1] ?? null,
    publishedAt: null,
  };
}

export function parseBlogPost(html: string): ParsedBlogPost {
  return deepUnsliceStrings(_parseBlogPost(html));
}
