/**
 * Plain, locale-neutral snapshot shapes written by `scrape.ts` to
 * `data/reference/*.json` and read back by `seed.ts`. These are intentionally
 * NOT the Mongo document shapes — money is a string (not yet `Decimal`),
 * images are `{ sourceUrl, alt? }` (not yet uploaded `ImageAsset`s), and
 * relations are the reference store's own numeric ids (`legacy.sallaId`),
 * resolved to Mongo ObjectIds only at seed time.
 */

export interface LocalizedText {
  ar: string;
  en: string;
}

export interface ScrapedImage {
  sourceUrl: string;
  alt?: string;
}

export interface ScrapedCategory {
  sallaId: string;
  name: LocalizedText;
  slug: LocalizedText;
  parentSallaId: string | null;
  level: 1 | 2 | 3;
  sortOrder: number;
  icon?: ScrapedImage | null;
  banner?: ScrapedImage | null;
  image?: ScrapedImage | null;
}

export interface ScrapedBrand {
  sallaId: string;
  name: LocalizedText;
  slug: LocalizedText;
  logo?: ScrapedImage | null;
  /** Raw HTML, sanitised at seed time. */
  description: LocalizedText;
  sortOrder: number;
}

export interface ScrapedProductOptionValue {
  name: LocalizedText;
  /** Raw money string as shown on the page ("0" almost always — see report). */
  additionalPrice: string;
  image?: ScrapedImage | null;
  isAvailable: boolean;
  sortOrder: number;
}

export interface ScrapedProductOptionGroup {
  name: LocalizedText;
  type: "thumbnail" | "text";
  required: boolean;
  values: ScrapedProductOptionValue[];
}

export interface ScrapedReview {
  /** Derived: `${productSallaId}:${author}:${date}` when the source has no id of its own. */
  legacyId: string;
  authorName: string;
  rating: number;
  body: string;
  reviewedAt: string;
}

export interface ScrapedProduct {
  sallaId: string;
  name: LocalizedText;
  /** Raw HTML, sanitised at seed time. */
  description: LocalizedText;
  slug: LocalizedText;
  /** The model-number line on the page ("رقم الموديل"/"Model"), NOT the bogus ld+json `sku` (see report). */
  sku?: string;
  brandName: LocalizedText | null;
  /** Resolved at scrape time from `categoryNames` against the nav-derived category tree. */
  brandSallaId: string | null;
  /** Category NAMES in meta `product:category`, ar/en positionally paired (kept for the report). */
  categoryNames: { ar: string[]; en: string[] };
  /** Resolved category ids (see `categoryNames`). */
  categoryIds: string[];
  /** The deepest-matched category id, or `null` when nothing matched. */
  primaryCategoryId: string | null;
  price: string;
  compareAtPrice: string | null;
  availability: "in_stock" | "out_of_stock";
  images: ScrapedImage[];
  options: ScrapedProductOptionGroup[];
  weight: LocalizedText;
  soldCount: number | null;
  ratingAverage: number;
  ratingCount: number;
  reviews: ScrapedReview[];
  badgeText: LocalizedText | null;
}

export interface ScrapedPage {
  sallaId: string;
  title: LocalizedText;
  slug: LocalizedText;
  /** Raw HTML, sanitised at seed time. */
  body: LocalizedText;
}

export interface ScrapedPost {
  sallaId: string;
  title: LocalizedText;
  slug: LocalizedText;
  excerpt: LocalizedText;
  /** Raw HTML, sanitised at seed time. */
  body: LocalizedText;
  cover?: ScrapedImage | null;
  publishedAt: string | null;
}

export interface ScrapedHomeMediaItem {
  image?: ScrapedImage | null;
  mobileImage?: ScrapedImage | null;
  title: LocalizedText;
  subtitle: LocalizedText;
  href: string;
}

export type ScrapedHomeSectionPayload =
  | { type: "HERO_SLIDER"; items: ScrapedHomeMediaItem[] }
  | { type: "TILE_ROW"; items: ScrapedHomeMediaItem[] }
  | { type: "BANNER"; items: ScrapedHomeMediaItem[] }
  | { type: "BRAND_CAROUSEL"; brandSallaIds: string[] }
  | {
      type: "SPOTLIGHT";
      productSallaId: string | null;
      videoUrl: string | null;
      couponCode: string | null;
      endsAt: string | null;
    }
  | {
      type: "PRODUCT_RAIL";
      source: "CATEGORY" | "PRODUCTS";
      categorySallaIds: string[];
      productSallaIds: string[];
      limit: number;
    }
  | { type: "TRUST_STRIP"; items: ScrapedHomeMediaItem[] }
  | { type: "SOCIAL_LINKS"; items: ScrapedHomeMediaItem[] }
  | { type: "FAQ"; items: { question: LocalizedText; answer: LocalizedText }[] }
  | { type: "BLOG_RAIL"; postSallaIds: string[] }
  | { type: "TESTIMONIALS"; items: { authorName: string; body: string; rating: number }[] }
  | {
      type: "BRANCH_MAP";
      branches: { name: LocalizedText; mapEmbedUrl: string }[];
    };

export interface ScrapedHomeSection {
  title: LocalizedText;
  sortOrder: number;
  payload: ScrapedHomeSectionPayload;
}

export interface ScrapedBranch {
  name: LocalizedText;
  address: LocalizedText;
  hours: LocalizedText;
  phone: string;
  mapEmbedUrl: string;
}

export interface ScrapedSettings {
  storeName: LocalizedText;
  logo: ScrapedImage | null;
  favicon: ScrapedImage | null;
  contact: { phone: string; whatsapp: string; email: string };
  social: Record<string, string>;
  legal: { vatNumber: string; crNumber: string; vatCertificate: ScrapedImage | null };
  announcements: LocalizedText[];
  footerDescription: LocalizedText;
  branches: ScrapedBranch[];
  popup: {
    title: LocalizedText;
    body: LocalizedText;
    ctaLabel: LocalizedText;
  } | null;
}

export interface ScrapedCoupon {
  code: string;
  description: LocalizedText;
  /** "PERCENT" only — this is all that was observed on the reference. */
  type: "PERCENT";
  value: string;
}

/** Evidence gathered for the quantity-tier upsell question; never a seedable entity. */
export interface QuantityTierFinding {
  evidence: string;
  storeWide: boolean | "unknown";
  tiers: { minQuantity: number; percent: number }[];
}

export interface ReferenceSnapshot {
  scrapedAt: string;
  categories: ScrapedCategory[];
  brands: ScrapedBrand[];
  products: ScrapedProduct[];
  pages: ScrapedPage[];
  posts: ScrapedPost[];
  home: { ar: ScrapedHomeSection[]; en: ScrapedHomeSection[] };
  faqs: { question: LocalizedText; answer: LocalizedText }[];
  testimonials: { authorName: string; body: string; rating: number }[];
  coupons: ScrapedCoupon[];
  promotions: QuantityTierFinding;
  settings: ScrapedSettings;
}

export interface ScrapeReport {
  scrapedAt: string;
  counts: Record<string, number>;
  warnings: string[];
  unmatchedCategoryNames: string[];
}
