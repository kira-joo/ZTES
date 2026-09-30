/**
 * Every cache tag the storefront reads under and the admin invalidates. The
 * values are this application's; the toolkit never sees them except as strings.
 */
export const CacheTag = {
  SETTINGS: "settings",
  CATEGORIES: "categories",
  BRANDS: "brands",
  PRODUCTS: "products",
  product: (id: string) => `product:${id}`,
  REVIEWS: "reviews",
  HOME: "home",
  PAGES: "pages",
  POSTS: "posts",
  FAQS: "faqs",
  TESTIMONIALS: "testimonials",
  COUPONS: "coupons",
} as const;
