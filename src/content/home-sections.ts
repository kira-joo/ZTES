/**
 * Home page section layout — static config (order, type, titles, which
 * category/product each section shows). The actual image/name/price for any
 * item that references a real catalog entity is resolved live against
 * `categories`/`products`/`brands` in `content.reads.ts`, so it never goes
 * stale when Admin edits the catalog. See docs/implementation-plan.md's
 * "Scope correction".
 *
 * `legacyId` values are the reference store's own catalog ids
 * (`legacy.sallaId` on the imported category/product) — stable identifiers
 * for real catalog data, not personal or business identity, so reusing them
 * carries none of the concerns documented in `store-config.ts`.
 *
 * The reference site's `BRANCH_MAP` section is dropped: ZTES has no branch
 * pickup (see the plan's excluded-features table).
 */
import type { LocalizedString } from "@kira-joo/toolkit-common";
import { HomeSectionType, ProductRailSource } from "src/common/enums";

export interface StaticMediaItem {
  kind: "category" | "product";
  legacyId: string;
  /** Overrides the live entity's own name when set (the reference's own marketing copy for that tile). */
  title?: LocalizedString;
  subtitle?: LocalizedString;
}

export interface StaticHomeSection {
  type: HomeSectionType;
  title?: LocalizedString;
  items?: StaticMediaItem[];
  trustItems?: { title: LocalizedString; subtitle: LocalizedString }[];
  source?: ProductRailSource;
  /** First of these that resolves to a real, active category wins. */
  categoryLegacyIds?: string[];
  productLegacyIds?: string[];
  limit?: number;
  spotlightProductLegacyId?: string;
  postLimit?: number;
}

export const HOME_SECTIONS: StaticHomeSection[] = [
  {
    type: HomeSectionType.HERO_SLIDER,
    items: [
      { kind: "category", legacyId: "337886132", subtitle: { ar: "ضيف ثقيل.. يتكيف مع كل الظروف", en: "" } },
      { kind: "category", legacyId: "333824810", subtitle: { ar: "مصدر الحكة.. وناقل الأمراض الخطير", en: "" } },
    ],
  },
  {
    type: HomeSectionType.TILE_ROW,
    title: { ar: "تسوق عن طريق الآفات", en: "Shop by Pest" },
    items: [
      { kind: "category", legacyId: "337886132", subtitle: { ar: "ضيف ثقيل.. يتكيف مع كل الظروف", en: "" } },
      { kind: "category", legacyId: "333824810", subtitle: { ar: "مصدر الحكة.. وناقل الأمراض الخطير", en: "" } },
      { kind: "category", legacyId: "158605365", subtitle: { ar: "مصدر الحكة.. وناقل الأمراض الخطير", en: "" } },
      { kind: "category", legacyId: "229775543", subtitle: { ar: "متسلل ذكي.. يخرب أكثر مما تتخيل", en: "" } },
      { kind: "category", legacyId: "977706155", subtitle: { ar: "ضيف غير مرحب به.. يزعج نومك ويسبب القلق", en: "" } },
      { kind: "category", legacyId: "1176020009", subtitle: { ar: "إزعاج طائر.. ينقل الأمراض بلا استئذان", en: "" } },
      { kind: "category", legacyId: "1711856309", subtitle: { ar: "خطر يتخفّى… يبدأ من التربة وينتهي بخسائر كبيرة", en: "" } },
      { kind: "category", legacyId: "840511780", subtitle: { ar: "لدغات مزعجة… وخطر صحي خفي", en: "" } },
      { kind: "category", legacyId: "557382434", subtitle: { ar: "حشرة خفيّة… تهاجم الورق والأقمشة بصمت", en: "" } },
      { kind: "category", legacyId: "1289894188", subtitle: { ar: "تبدأ بحبة… وتنتهي بمخزن كامل", en: "" } },
    ],
  },
  {
    type: HomeSectionType.TILE_ROW,
    title: { ar: "تسوق عن طريق الآفات الزراعية", en: "Shop by Agricultural Pest" },
    items: [
      { kind: "category", legacyId: "1914409044", subtitle: { ar: "خفيّ… ومدمّر للنخيل", en: "" } },
      { kind: "category", legacyId: "1448104522", subtitle: { ar: "ناعم… ويمتص العصارة", en: "" } },
      { kind: "category", legacyId: "150742136", subtitle: { ar: "صغير… وسريع الانتشار", en: "" } },
      { kind: "category", legacyId: "465906752", subtitle: { ar: "خفيف… ويسبّب اصفرار", en: "" } },
      { kind: "category", legacyId: "290818371", subtitle: { ar: "ليليّ… يقطع الشتلات", en: "" } },
      { kind: "category", legacyId: "639968089", subtitle: { ar: "جماعيّ… يلتهم المحاصيل", en: "" } },
    ],
  },
  { type: HomeSectionType.BRAND_CAROUSEL },
  { type: HomeSectionType.SPOTLIGHT, spotlightProductLegacyId: "1630715407" },
  {
    type: HomeSectionType.TILE_ROW,
    items: [
      { kind: "category", legacyId: "1640339135", subtitle: { ar: "أكتشف مبيدات الصحة العامة", en: "" } },
      { kind: "category", legacyId: "1603921754", subtitle: { ar: "أكتشف مبيدات الزراعة لمزرعتك", en: "" } },
      { kind: "category", legacyId: "973085470", subtitle: { ar: "أكتشف الأسمدة الزراعية لمزرعتك", en: "" } },
      { kind: "category", legacyId: "1369570345", subtitle: { ar: "أكتشف معدات الضباب والرش", en: "" } },
      { kind: "category", legacyId: "2071246913", subtitle: { ar: "أكتشف حديقة بيتك الصغيرة", en: "" } },
      { kind: "category", legacyId: "1180650579", subtitle: { ar: "أكتشف جمال زراعتك من البداية", en: "" } },
    ],
  },
  {
    type: HomeSectionType.PRODUCT_RAIL,
    title: { ar: "المنتجات الأفضل مبيعاً", en: "Best Selling Products" },
    source: ProductRailSource.PRODUCTS,
    productLegacyIds: ["266433170", "223019350", "1630715407", "809698676", "90237646"],
    limit: 12,
  },
  { type: HomeSectionType.SPOTLIGHT, spotlightProductLegacyId: "983058989" },
  {
    type: HomeSectionType.PRODUCT_RAIL,
    title: { ar: "مبيدات بق الفراش", en: "Bed Bug Control Products" },
    source: ProductRailSource.PRODUCTS,
    productLegacyIds: ["983058989", "179692478", "1114601183", "2051139149", "709363375"],
    limit: 12,
  },
  {
    type: HomeSectionType.TILE_ROW,
    title: { ar: "الباقات الاحترافية", en: "Professional Packages" },
    items: [
      { kind: "product", legacyId: "204420481" },
      { kind: "product", legacyId: "225856318" },
      { kind: "product", legacyId: "2117348988" },
      { kind: "product", legacyId: "1293918636" },
      { kind: "product", legacyId: "1010835229" },
      { kind: "product", legacyId: "1418673347" },
    ],
  },
  {
    type: HomeSectionType.PRODUCT_RAIL,
    title: { ar: "منتجات الصراصير", en: "Cockroach Control Products" },
    source: ProductRailSource.CATEGORY,
    categoryLegacyIds: ["337886132", "1578586427", "102848620"],
    limit: 16,
  },
  {
    type: HomeSectionType.PRODUCT_RAIL,
    title: { ar: "منتجات القوارض", en: "Rodent Control Products" },
    source: ProductRailSource.CATEGORY,
    categoryLegacyIds: ["229775543", "1065567816", "1355145557"],
    limit: 16,
  },
  {
    type: HomeSectionType.PRODUCT_RAIL,
    title: { ar: "المرشات", en: "Sprayers" },
    source: ProductRailSource.CATEGORY,
    categoryLegacyIds: ["1443782273"],
    limit: 16,
  },
  {
    type: HomeSectionType.TRUST_STRIP,
    trustItems: [
      { title: { ar: "الدفع عند الاستلام", en: "Cash on Delivery" }, subtitle: { ar: "ادفع نقدًا عند استلام طلبك", en: "Pay in cash when your order arrives" } },
      { title: { ar: "توصيل سريع داخل الرياض", en: "Fast Riyadh Delivery" }, subtitle: { ar: "التوصيل خلال 24–48 ساعة", en: "Delivered within 24–48 hours" } },
      { title: { ar: "تشكيلة متكاملة", en: "A Complete Range" }, subtitle: { ar: "مبيدات ومعدات مكافحة لكل احتياج", en: "Pest control products and equipment for every need" } },
    ],
  },
  {
    type: HomeSectionType.PRODUCT_RAIL,
    title: { ar: "منتجات الذباب", en: "Fly Control Products" },
    source: ProductRailSource.CATEGORY,
    categoryLegacyIds: ["1176020009"],
    limit: 16,
  },
  {
    type: HomeSectionType.PRODUCT_RAIL,
    title: { ar: "ماكينات الضباب", en: "Fogging Machines" },
    source: ProductRailSource.CATEGORY,
    categoryLegacyIds: ["1799420302"],
    limit: 16,
  },
  {
    type: HomeSectionType.PRODUCT_RAIL,
    title: { ar: "المصائد الضوئية", en: "Insect Light Traps" },
    source: ProductRailSource.CATEGORY,
    categoryLegacyIds: ["1417492590"],
    limit: 16,
  },
  {
    type: HomeSectionType.PRODUCT_RAIL,
    title: { ar: "منتجات النمل الأبيض", en: "Termite Control Products" },
    source: ProductRailSource.CATEGORY,
    categoryLegacyIds: ["1711856309"],
    limit: 16,
  },
  {
    type: HomeSectionType.PRODUCT_RAIL,
    title: { ar: "مكافحة البعوض", en: "Mosquito Control" },
    source: ProductRailSource.CATEGORY,
    categoryLegacyIds: ["333824810"],
    limit: 12,
  },
  {
    type: HomeSectionType.PRODUCT_RAIL,
    title: { ar: "أحدث الأسمدة الزراعية", en: "Latest Agricultural Fertilizers" },
    source: ProductRailSource.CATEGORY,
    categoryLegacyIds: ["973085470", "408975533", "1035600810"],
    limit: 12,
  },
  { type: HomeSectionType.SOCIAL_LINKS },
  { type: HomeSectionType.FAQ },
  { type: HomeSectionType.BLOG_RAIL, postLimit: 8 },
  { type: HomeSectionType.TESTIMONIALS },
];
