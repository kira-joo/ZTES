import "server-only";
import { AssetProviderType } from "@kira-joo/toolkit-common";
import { HomeSectionType, ProductRailSource, ProductSort } from "src/common/enums";
import type {
  CouponPublicView,
  FaqView,
  HomeMediaItemView,
  HomeSectionView,
  PageView,
  ProductCardView,
  SettingsView,
  TestimonialView,
} from "src/common/types/storefront";
import { FAQS } from "src/content/faqs";
import { HOME_SECTIONS, type StaticHomeSection, type StaticMediaItem } from "src/content/home-sections";
import { PAGES } from "src/content/pages";
import { STORE_CONFIG } from "src/content/store-config";
import { TESTIMONIALS } from "src/content/testimonials";
import { CategoryModel, type CategorySchema } from "src/server/catalog/category.schema";
import { ProductModel, type ProductSchema } from "src/server/catalog/product.schema";
import { CouponModel } from "src/server/commerce/coupon.schema";
import { CacheTag } from "src/server/core/revalidation/cache-tag";
import { pickSlug } from "src/lib/localized";
import { cachedRead } from "./cached-read";
import { getBrands, listProducts, toCards } from "./catalog.reads";
import { CARD_FIELDS, emptyLocalized } from "./mappers";

const E = emptyLocalized;
const ACTIVE = { isActive: true, deletedAt: null };

// ─── Store config, FAQ, testimonials ───────────────────────────────────────
// All static app content (src/content/*) — no database, no cache tag needed;
// it only changes on deploy. See docs/implementation-plan.md's "Scope
// correction".

export async function getSettings(): Promise<SettingsView> {
  return STORE_CONFIG;
}

export async function getFaqs(): Promise<FaqView[]> {
  return FAQS;
}

export async function getTestimonials(): Promise<TestimonialView[]> {
  return TESTIMONIALS;
}

export async function getPages(): Promise<PageView[]> {
  return PAGES;
}

export async function getPageBySlug(locale: "ar" | "en", slug: string): Promise<PageView | null> {
  return PAGES.find((page) => page.slug[locale] === slug) ?? null;
}

/** The search modal's zero-query state: top active categories and top-selling products, derived live. */
export const getSearchSuggestions = cachedRead("search-suggestions", [CacheTag.CATEGORIES, CacheTag.PRODUCTS], async () => {
  const categories = await CategoryModel.find({ isActive: true, showInMenu: true })
    .sort({ sortOrder: 1, _id: 1 })
    .limit(8)
    .select("name slug")
    .lean();
  const products = (await listProducts({ sort: ProductSort.BEST_SELLING, limit: 8 })).items;
  return {
    categories: categories.map((category) => ({ _id: String(category._id), name: category.name, slug: category.slug })),
    products,
  };
});

export const getPublicCoupon = cachedRead("coupon-public", [CacheTag.COUPONS], async (code: string): Promise<CouponPublicView | null> => {
  const coupon = await CouponModel.findOne({ code: code.toUpperCase(), isActive: true }).select("code description endsAt").lean();
  if (!coupon || (coupon.endsAt && coupon.endsAt.getTime() <= Date.now())) return null;
  return { code: coupon.code, description: coupon.description ?? E() };
});

// ─── Home ───────────────────────────────────────────────────────────────────
// Section layout is static (src/content/home-sections.ts); any item tied to a
// real category/product/brand is resolved live here so it never goes stale.

async function categoryByLegacyId(legacyId: string): Promise<Pick<CategorySchema, "_id" | "name" | "slug" | "image"> | null> {
  return CategoryModel.findOne({ ...ACTIVE, "legacy.sallaId": legacyId })
    .select("name slug image")
    .lean<Pick<CategorySchema, "_id" | "name" | "slug" | "image">>();
}

/** First of `legacyIds` that resolves to a real, active category. */
async function firstCategoryByLegacyIds(legacyIds: string[]): Promise<Pick<CategorySchema, "_id" | "name" | "slug"> | null> {
  const found = await CategoryModel.find({ ...ACTIVE, "legacy.sallaId": { $in: legacyIds } })
    .select("_id name slug legacy")
    .lean<(Pick<CategorySchema, "_id" | "name" | "slug"> & { legacy?: { sallaId?: string } })[]>();
  const byLegacyId = new Map(found.map((category) => [category.legacy?.sallaId, category]));
  for (const id of legacyIds) {
    const category = byLegacyId.get(id);
    if (category) return category;
  }
  return null;
}

async function productCardByLegacyId(legacyId: string): Promise<ProductCardView | null> {
  const product = await ProductModel.findOne({ ...ACTIVE, "legacy.sallaId": legacyId })
    .select(CARD_FIELDS)
    .lean<ProductSchema>();
  return product ? (await toCards([product]))[0]! : null;
}

async function productCardsByLegacyIds(legacyIds: string[]): Promise<ProductCardView[]> {
  if (legacyIds.length === 0) return [];
  const products = await ProductModel.find({ ...ACTIVE, "legacy.sallaId": { $in: legacyIds } })
    .select(`${CARD_FIELDS} legacy.sallaId`)
    .lean<(ProductSchema & { legacy?: { sallaId?: string } })[]>();
  const byLegacyId = new Map(products.map((product) => [product.legacy?.sallaId, product]));
  const ordered = legacyIds.map((id) => byLegacyId.get(id)).filter((product): product is ProductSchema => Boolean(product));
  return toCards(ordered);
}

async function resolveMediaItem(item: StaticMediaItem, locale: "ar" | "en"): Promise<HomeMediaItemView | null> {
  if (item.kind === "banner") {
    const src = item.src[locale] || item.src.ar;
    return {
      _id: `banner-${src}`,
      // A static /public file in the same `ImageAsset` shape `StoreImage` renders; not an upload.
      image: {
        provider: AssetProviderType.CLOUDINARY,
        publicId: `static${src}`,
        secureUrl: src,
        format: src.split(".").pop() ?? "png",
        width: item.width,
        height: item.height,
        bytes: 0,
      },
      mobileImage: null,
      title: item.title,
      subtitle: E(),
      href: item.href,
    };
  }
  if (item.kind === "category") {
    const category = await categoryByLegacyId(item.legacyId);
    if (!category) return null;
    return {
      _id: `cat-${item.legacyId}`,
      image: category.image ?? null,
      mobileImage: null,
      title: item.title ?? category.name,
      subtitle: item.subtitle ?? E(),
      href: `/categories/${pickSlug(category.slug, locale)}`,
    };
  }
  const product = await productCardByLegacyId(item.legacyId);
  if (!product) return null;
  return {
    _id: `prod-${item.legacyId}`,
    image: product.image,
    mobileImage: null,
    title: item.title ?? product.name,
    subtitle: item.subtitle ?? E(),
    href: `/products/${pickSlug(product.slug, locale)}`,
  };
}

async function resolveSection(
  section: StaticHomeSection,
  index: number,
  locale: "ar" | "en",
  faqs: FaqView[],
  testimonials: TestimonialView[],
  brands: Awaited<ReturnType<typeof getBrands>>
): Promise<HomeSectionView> {
  const base: HomeSectionView = {
    _id: `home-${index}`,
    type: section.type,
    title: section.title ?? E(),
    items: [],
    products: [],
    category: null,
    brands: [],
    faqs: [],
    testimonials: [],
    videoUrl: "",
    couponCode: "",
    endsAt: null,
  };

  switch (section.type) {
    case HomeSectionType.HERO_SLIDER:
    case HomeSectionType.TILE_ROW: {
      const resolved = await Promise.all((section.items ?? []).map((item) => resolveMediaItem(item, locale)));
      base.items = resolved.filter((item): item is HomeMediaItemView => item !== null);
      return base;
    }
    case HomeSectionType.TRUST_STRIP:
      base.items = (section.trustItems ?? []).map((item, i) => ({ _id: `trust-${i}`, image: null, mobileImage: null, title: item.title, subtitle: item.subtitle, href: "" }));
      return base;
    case HomeSectionType.PRODUCT_RAIL: {
      const limit = section.limit ?? 12;
      if (section.source === ProductRailSource.CATEGORY) {
        const category = await firstCategoryByLegacyIds(section.categoryLegacyIds ?? []);
        base.category = category ? { name: category.name, slug: category.slug } : null;
        base.products = category ? (await listProducts({ category: String(category._id), sort: ProductSort.BEST_SELLING, limit })).items : [];
      } else {
        base.products = (await productCardsByLegacyIds(section.productLegacyIds ?? [])).slice(0, limit);
      }
      return base;
    }
    case HomeSectionType.SPOTLIGHT:
      base.products = section.spotlightProductLegacyId ? await productCardByLegacyId(section.spotlightProductLegacyId).then((p) => (p ? [p] : [])) : [];
      return base;
    case HomeSectionType.BRAND_CAROUSEL:
      base.brands = brands;
      return base;
    case HomeSectionType.FAQ:
      base.faqs = faqs;
      return base;
    case HomeSectionType.TESTIMONIALS:
      base.testimonials = testimonials;
      return base;
    default:
      // SOCIAL_LINKS reads settings.social directly at render time; BANNER and
      // BRANCH_MAP are not used in the static config (see home-sections.ts).
      return base;
  }
}

/** Every home section with the data it renders resolved live against the catalog. */
export const getHomeSections = cachedRead(
  "home",
  [CacheTag.PRODUCTS, CacheTag.CATEGORIES, CacheTag.BRANDS],
  async (locale: "ar" | "en"): Promise<HomeSectionView[]> => {
    const [brands, faqs, testimonials] = await Promise.all([getBrands(), getFaqs(), getTestimonials()]);
    return Promise.all(HOME_SECTIONS.map((section, index) => resolveSection(section, index, locale, faqs, testimonials, brands)));
  }
);
