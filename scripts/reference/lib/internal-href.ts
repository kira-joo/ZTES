/**
 * Rewrites a reference-site link into a ZTES path. Category/product/brand
 * links resolve to a placeholder (`category:<sallaId>`) that `seed.ts`
 * substitutes for the real localized-slug path once every entity has been
 * imported and has an id to look up; anything else maps to its ZTES
 * equivalent or is left as an absolute URL.
 */
export function internalHref(href: string, host = "orkidastore.com"): string {
  if (!href) return "";
  const url = (() => {
    try {
      return new URL(href, `https://${host}`);
    } catch {
      return null;
    }
  })();
  if (!url || !new RegExp(`${host.replace(/\./g, "\\.")}$`).test(url.hostname)) return href;

  const category = /\/c(\d+)$/.exec(url.pathname)?.[1];
  if (category) return `category:${category}`;
  const product = /\/p(\d+)$/.exec(url.pathname)?.[1];
  if (product) return `product:${product}`;
  const brand = /\/brand-(\d+)$/.exec(url.pathname)?.[1];
  if (brand) return `brand:${brand}`;
  if (/\/offers\/?$/.test(url.pathname)) return "/offers";
  if (/\/brands\/?$/.test(url.pathname)) return "/brands";
  if (/\/blog\/?$/.test(url.pathname)) return "/blog";
  const decoded = (() => {
    try {
      return decodeURIComponent(url.pathname);
    } catch {
      return url.pathname;
    }
  })();
  return decoded.replace(/^\/(ar|en)/, "") || "/";
}
