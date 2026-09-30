import "server-only";
import mongoose from "mongoose";
import { HomeSectionType, ProductRailSource, ProductSort } from "src/common/enums";
import type {
  BrandView,
  CouponPublicView,
  FaqView,
  HomeSectionView,
  PageView,
  PostCardView,
  PostView,
  SettingsView,
  TestimonialView,
} from "src/common/types/storefront";
import { CategoryModel } from "src/server/catalog/category.schema";
import { CouponModel } from "src/server/commerce/coupon.schema";
import { HomeSectionModel, type HomeSectionSchema } from "src/server/content/home-section.schema";
import { PageModel, PostModel, type PageSchema, type PostSchema } from "src/server/content/page.schema";
import { getSettingsDocument } from "src/server/content/settings.service";
import { FaqModel, TestimonialModel } from "src/server/content/small-content.schema";
import { readMoney, readOptionalMoney } from "src/server/core/money";
import { CacheTag } from "src/server/core/revalidation/cache-tag";
import { cachedRead } from "./cached-read";
import { getBrands, getProductsByIds, listProducts } from "./catalog.reads";
import { emptyLocalized } from "./mappers";

const E = emptyLocalized;

export const getSettings = cachedRead("settings", [CacheTag.SETTINGS], async (): Promise<SettingsView> => {
  const s = await getSettingsDocument();
  return {
    storeName: s.storeName ?? E(),
    tagline: s.tagline ?? E(),
    logo: s.logo ?? null,
    favicon: s.favicon ?? null,
    contact: { ...{ phone: "", whatsapp: "", email: "", address: E() }, ...s.contact },
    social: { ...{ instagram: "", x: "", tiktok: "", facebook: "", youtube: "", snapchat: "" }, ...s.social },
    legal: { vatNumber: s.legal?.vatNumber ?? "", crNumber: s.legal?.crNumber ?? "", vatCertificate: s.legal?.vatCertificate ?? null },
    appLinks: { ...{ appStore: "", googlePlay: "" }, ...s.appLinks },
    announcements: s.announcements ?? [],
    footerDescription: s.footerDescription ?? E(),
    delivery: {
      city: s.delivery?.city ?? { ar: "الرياض", en: "Riyadh" },
      fee: readMoney(s.delivery?.fee).toFixed(2),
      freeShippingThreshold: readOptionalMoney(s.delivery?.freeShippingThreshold)?.toFixed(2) ?? null,
      estimate: s.delivery?.estimate ?? E(),
    },
    vatRate: s.vatRate ?? 15,
    safeUseTitle: s.safeUseTitle ?? E(),
    safeUseText: s.safeUseText ?? E(),
    branches: (s.branches ?? []).map((branch) => ({ ...branch, _id: String(branch._id) })),
    popup: {
      isActive: s.popup?.isActive ?? false,
      title: s.popup?.title ?? E(),
      body: s.popup?.body ?? E(),
      image: s.popup?.image ?? null,
      ctaLabel: s.popup?.ctaLabel ?? E(),
      ctaHref: s.popup?.ctaHref ?? "",
    },
    seo: s.seo ?? { title: E(), description: E() },
  };
});

export const getSearchSuggestions = cachedRead("search-suggestions", [CacheTag.SETTINGS, CacheTag.CATEGORIES, CacheTag.PRODUCTS], async () => {
  const s = await getSettingsDocument();
  const categoryIds = (s.searchCategories ?? []).map(String);
  const categories = await CategoryModel.find({ _id: { $in: categoryIds }, isActive: true }).select("name slug").lean();
  const byId = new Map(categories.map((category) => [String(category._id), category]));
  return {
    categories: categoryIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((category) => ({ _id: String(category!._id), name: category!.name, slug: category!.slug })),
    products: await getProductsByIds((s.searchProducts ?? []).map(String)),
  };
});

export const getFaqs = cachedRead("faqs", [CacheTag.FAQS], async (): Promise<FaqView[]> =>
  (await FaqModel.find({ isActive: true }).sort({ sortOrder: 1, _id: 1 }).lean()).map((faq) => ({
    _id: String(faq._id),
    question: faq.question,
    answer: faq.answer,
  }))
);

export const getTestimonials = cachedRead("testimonials", [CacheTag.TESTIMONIALS], async (): Promise<TestimonialView[]> =>
  (await TestimonialModel.find({ isActive: true }).sort({ sortOrder: 1, _id: 1 }).lean()).map((item) => ({
    _id: String(item._id),
    authorName: item.authorName,
    body: item.body,
    rating: item.rating,
    avatar: item.avatar ?? null,
  }))
);

function toPostCard(post: PostSchema): PostCardView {
  return {
    _id: String(post._id),
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? E(),
    cover: post.cover ?? null,
    publishedAt: post.publishedAt.toISOString(),
  };
}

/** A post is listed in a locale only when it has a title and body in that locale. */
function localeFilter(locale: "ar" | "en") {
  return { [`title.${locale}`]: { $nin: ["", null] }, [`body.${locale}`]: { $nin: ["", null] } };
}

export const getPosts = cachedRead(
  "posts",
  [CacheTag.POSTS],
  async (locale: "ar" | "en", page: number = 1, limit: number = 12): Promise<{ items: PostCardView[]; total: number }> => {
    const filter = { isPublished: true, ...localeFilter(locale) };
    const [items, total] = await Promise.all([
      PostModel.find(filter).sort({ publishedAt: -1 }).skip((page - 1) * limit).limit(limit).lean<PostSchema[]>(),
      PostModel.countDocuments(filter),
    ]);
    return { items: items.map(toPostCard), total };
  }
);

export const getPostBySlug = cachedRead("post-by-slug", [CacheTag.POSTS], async (locale: "ar" | "en", slug: string): Promise<PostView | null> => {
  const post = await PostModel.findOne({ isPublished: true, [`slug.${locale}`]: slug, ...localeFilter(locale) }).lean<PostSchema>();
  return post ? { ...toPostCard(post), body: post.body, seo: post.seo ?? { title: E(), description: E() } } : null;
});

function toPageView(page: PageSchema): PageView {
  return {
    _id: String(page._id),
    title: page.title,
    slug: page.slug,
    body: page.body,
    showInFooter: page.showInFooter,
    seo: page.seo ?? { title: E(), description: E() },
    updatedAt: ((page as { updatedAt?: Date }).updatedAt ?? new Date()).toISOString(),
  };
}

export const getPages = cachedRead("pages", [CacheTag.PAGES], async (): Promise<PageView[]> =>
  (await PageModel.find({ isActive: true }).sort({ sortOrder: 1, _id: 1 }).lean<PageSchema[]>()).map(toPageView)
);

export const getPageBySlug = cachedRead("page-by-slug", [CacheTag.PAGES], async (locale: "ar" | "en", slug: string): Promise<PageView | null> => {
  const page = await PageModel.findOne({ isActive: true, [`slug.${locale}`]: slug }).lean<PageSchema>();
  return page ? toPageView(page) : null;
});

export const getPublicCoupon = cachedRead("coupon-public", [CacheTag.COUPONS], async (code: string): Promise<CouponPublicView | null> => {
  const coupon = await CouponModel.findOne({ code: code.toUpperCase(), isActive: true }).select("code description endsAt").lean();
  if (!coupon || (coupon.endsAt && coupon.endsAt.getTime() <= Date.now())) return null;
  return { code: coupon.code, description: coupon.description ?? E() };
});

// ─── Home ───────────────────────────────────────────────────────────────────

const blank = (section: HomeSectionSchema): HomeSectionView => ({
  _id: String(section._id),
  type: section.type,
  title: section.title ?? E(),
  items: (section.payload.items ?? []).map((item, index) => ({
    _id: item._id ?? String(index),
    image: item.image ?? null,
    mobileImage: item.mobileImage ?? null,
    title: item.title ?? E(),
    subtitle: item.subtitle ?? E(),
    href: item.href ?? "",
  })),
  products: [],
  category: null,
  brands: [],
  faqs: [],
  testimonials: [],
  posts: [],
  videoUrl: section.payload.videoUrl ?? "",
  couponCode: section.payload.couponCode ?? "",
  endsAt: section.payload.endsAt ?? null,
});

/** Every active home section with the data it renders resolved. */
export const getHomeSections = cachedRead(
  "home",
  [CacheTag.HOME, CacheTag.PRODUCTS, CacheTag.BRANDS, CacheTag.FAQS, CacheTag.TESTIMONIALS, CacheTag.POSTS],
  async (locale: "ar" | "en"): Promise<HomeSectionView[]> => {
    const sections = await HomeSectionModel.find({ isActive: true }).sort({ sortOrder: 1, _id: 1 }).lean<HomeSectionSchema[]>();
    const [brands, faqs, testimonials] = await Promise.all([getBrands(), getFaqs(), getTestimonials()]);

    return Promise.all(
      sections.map(async (section) => {
        const view = blank(section);
        const payload = section.payload;
        switch (section.type) {
          case HomeSectionType.PRODUCT_RAIL: {
            const limit = payload.limit ?? 12;
            if (payload.source === ProductRailSource.CATEGORY && payload.category && mongoose.isValidObjectId(payload.category)) {
              const category = await CategoryModel.findById(payload.category).select("name slug").lean();
              view.category = category ? { name: category.name, slug: category.slug } : null;
              view.products = (await listProducts({ category: payload.category, sort: ProductSort.BEST_SELLING, limit })).items;
            } else {
              view.products = (await getProductsByIds(payload.products ?? [])).slice(0, limit);
            }
            break;
          }
          case HomeSectionType.SPOTLIGHT:
            view.products = payload.product ? await getProductsByIds([payload.product]) : [];
            break;
          case HomeSectionType.BRAND_CAROUSEL: {
            const wanted = payload.brands ?? [];
            view.brands = wanted.length
              ? wanted.map((id) => brands.find((brand) => brand._id === id)).filter((brand): brand is BrandView => Boolean(brand))
              : brands;
            break;
          }
          case HomeSectionType.FAQ:
            view.faqs = faqs;
            break;
          case HomeSectionType.TESTIMONIALS:
            view.testimonials = testimonials;
            break;
          case HomeSectionType.BLOG_RAIL:
            view.posts = (await getPosts(locale, 1, payload.limit ?? 8)).items;
            break;
        }
        return view;
      })
    );
  }
);
