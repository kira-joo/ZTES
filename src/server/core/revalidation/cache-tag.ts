/**
 * Every cache tag the storefront reads under and the admin invalidates. The
 * values are this application's; the toolkit never sees them except as
 * strings. Static content (src/content/*.ts — settings, home sections, FAQ,
 * testimonials, pages, posts) needs no tag; it only changes on deploy. See
 * docs/implementation-plan.md's "Scope correction".
 */
export const CacheTag = {
  CATEGORIES: "categories",
  BRANDS: "brands",
  PRODUCTS: "products",
  product: (id: string) => `product:${id}`,
  REVIEWS: "reviews",
  COUPONS: "coupons",
} as const;
