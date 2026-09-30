/**
 * The plain, JSON-safe shapes the storefront renders. Money is a fixed-scale
 * string ("89.00"), ids are strings, dates ISO strings. Produced by
 * src/server/storefront/*.reads.ts; consumed by Server and Client Components.
 */
import type { ImageAsset, LocalizedString } from "@kira-joo/toolkit-common";
import type { BadgeTone, HomeSectionType, ProductOptionType, ProductSort } from "src/common/enums";

export type { ImageAsset, LocalizedString };

export interface LocalizedSlug {
  ar: string;
  en: string;
}

export interface SeoView {
  title: LocalizedString;
  description: LocalizedString;
}

export interface BranchView {
  _id: string;
  name: LocalizedString;
  address: LocalizedString;
  hours: LocalizedString;
  phone: string;
  mapUrl: string;
  mapEmbedUrl: string;
}

export interface SettingsView {
  storeName: LocalizedString;
  tagline: LocalizedString;
  logo: ImageAsset | null;
  favicon: ImageAsset | null;
  contact: { phone: string; whatsapp: string; email: string; address: LocalizedString };
  social: Record<"instagram" | "x" | "tiktok" | "facebook" | "youtube" | "snapchat", string>;
  legal: { vatNumber: string; crNumber: string; vatCertificate: ImageAsset | null };
  appLinks: { appStore: string; googlePlay: string };
  announcements: LocalizedString[];
  footerDescription: LocalizedString;
  delivery: { city: LocalizedString; fee: string; freeShippingThreshold: string | null; estimate: LocalizedString };
  vatRate: number;
  safeUseTitle: LocalizedString;
  safeUseText: LocalizedString;
  branches: BranchView[];
  popup: {
    isActive: boolean;
    title: LocalizedString;
    body: LocalizedString;
    image: ImageAsset | null;
    ctaLabel: LocalizedString;
    ctaHref: string;
  };
  seo: SeoView;
}

export interface CategoryNode {
  _id: string;
  name: LocalizedString;
  slug: LocalizedSlug;
  icon: ImageAsset | null;
  image: ImageAsset | null;
  showInMenu: boolean;
  children: CategoryNode[];
}

export interface CategoryView {
  _id: string;
  name: LocalizedString;
  slug: LocalizedSlug;
  description: LocalizedString;
  image: ImageAsset | null;
  banner: ImageAsset | null;
  seo: SeoView;
  /** Root first, ending with this category. */
  breadcrumb: { _id: string; name: LocalizedString; slug: LocalizedSlug }[];
  children: { _id: string; name: LocalizedString; slug: LocalizedSlug }[];
}

export interface BrandView {
  _id: string;
  name: LocalizedString;
  slug: LocalizedSlug;
  logo: ImageAsset | null;
  description: LocalizedString;
  seo: SeoView;
}

export interface ProductBadgeView {
  label: LocalizedString;
  tone: BadgeTone;
}

export interface ProductCardView {
  _id: string;
  name: LocalizedString;
  slug: LocalizedSlug;
  brand: { name: LocalizedString; slug: LocalizedSlug } | null;
  image: ImageAsset | null;
  hoverImage: ImageAsset | null;
  price: string;
  compareAtPrice: string | null;
  saleEndsAt: string | null;
  badge: ProductBadgeView | null;
  ratingAverage: number;
  ratingCount: number;
  inStock: boolean;
  /** Required options mean "add to cart" must go through the product page or quick view. */
  hasRequiredOptions: boolean;
}

export interface ProductOptionValueView {
  _id: string;
  label: LocalizedString;
  priceDelta: string;
  image: ImageAsset | null;
  isAvailable: boolean;
}

export interface ProductOptionGroupView {
  _id: string;
  name: LocalizedString;
  type: ProductOptionType;
  required: boolean;
  values: ProductOptionValueView[];
}

export interface ProductDetailView extends ProductCardView {
  description: LocalizedString;
  sku: string | null;
  images: ImageAsset[];
  stock: number;
  trackStock: boolean;
  weight: LocalizedString;
  options: ProductOptionGroupView[];
  quantityTiers: { minQuantity: number; percent: number }[];
  soldCount: number;
  primaryCategory: { _id: string; name: LocalizedString; slug: LocalizedSlug } | null;
  breadcrumb: { _id: string; name: LocalizedString; slug: LocalizedSlug }[];
  brandId: string | null;
  seo: SeoView;
}

export interface ReviewView {
  _id: string;
  authorName: string;
  rating: number;
  body: string;
  reviewedAt: string;
}

export interface FacetOption {
  _id: string;
  name: LocalizedString;
  slug: LocalizedSlug;
  count: number;
}

export interface ProductListParams {
  category?: string;
  brand?: string;
  onSale?: boolean;
  search?: string;
  brands?: string[];
  categories?: string[];
  sort?: ProductSort;
  page?: number;
  limit?: number;
}

export interface ProductListView {
  items: ProductCardView[];
  total: number;
  page: number;
  totalPages: number;
  facets: { categories: FacetOption[]; brands: FacetOption[] };
}

export interface HomeMediaItemView {
  _id: string;
  image: ImageAsset | null;
  mobileImage: ImageAsset | null;
  title: LocalizedString;
  subtitle: LocalizedString;
  href: string;
}

export interface HomeSectionView {
  _id: string;
  type: HomeSectionType;
  title: LocalizedString;
  items: HomeMediaItemView[];
  /** PRODUCT_RAIL / SPOTLIGHT */
  products: ProductCardView[];
  /** PRODUCT_RAIL with a category source: its link target. */
  category: { name: LocalizedString; slug: LocalizedSlug } | null;
  brands: BrandView[];
  faqs: FaqView[];
  testimonials: TestimonialView[];
  posts: PostCardView[];
  videoUrl: string;
  couponCode: string;
  endsAt: string | null;
}

export interface FaqView {
  _id: string;
  question: LocalizedString;
  answer: LocalizedString;
}

export interface TestimonialView {
  _id: string;
  authorName: string;
  body: LocalizedString;
  rating: number;
  avatar: ImageAsset | null;
}

export interface PageView {
  _id: string;
  title: LocalizedString;
  slug: LocalizedSlug;
  body: LocalizedString;
  showInFooter: boolean;
  seo: SeoView;
  updatedAt: string;
}

export interface PostCardView {
  _id: string;
  title: LocalizedString;
  slug: LocalizedSlug;
  excerpt: LocalizedString;
  cover: ImageAsset | null;
  publishedAt: string;
}

export interface PostView extends PostCardView {
  body: LocalizedString;
  seo: SeoView;
}

export interface SearchResultView {
  products: ProductCardView[];
  categories: { _id: string; name: LocalizedString; slug: LocalizedSlug }[];
}

export interface CouponPublicView {
  code: string;
  description: LocalizedString;
}
