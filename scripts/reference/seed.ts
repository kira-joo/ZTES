/**
 * Reference importer, stage 2: load `data/reference/snapshot.json` (written by
 * `npm run reference:scrape`) into MongoDB through the application's own models.
 *
 *   npm run reference:seed                  # insert what is missing
 *   npm run reference:seed -- --overwrite   # also update records imported before
 *   npm run reference:seed -- --skip-images # no Cloudinary: image fields stay empty
 *   npm run reference:seed -- --dry-run     # report only, write nothing
 *
 * Behaviour, stated because it decides what an admin edit survives:
 * - Every catalog/content record is keyed by `legacy.sallaId` (the reference
 *   store's id), so re-running never duplicates.
 * - By default an existing record is LEFT ALONE — the admin owns it once it is
 *   imported. `--overwrite` replaces imported fields with the snapshot's.
 * - Store settings and home sections have no reference id: they are written
 *   only when the settings document / the home-section collection is empty,
 *   or with `--overwrite`.
 * - Images are downloaded once and uploaded through the app's Cloudinary
 *   provider; `data/reference/image-map.json` remembers source URL → asset so a
 *   re-run never uploads twice.
 * - No cache invalidation happens here (a script is not an HTTP mutation); a
 *   running dev server's cached reads expire on their own hourly ceiling, or
 *   restart it.
 */
import "reflect-metadata";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AssetProvider } from "@kira-joo/backend-toolkit-core";
import { toMoney, type ImageAsset } from "@kira-joo/toolkit-common";
import mongoose from "mongoose";
import { BadgeTone, HomeSectionType, ProductOptionType, ProductRailSource, CouponType } from "src/common/enums";
import { BrandModel } from "src/server/catalog/brand.schema";
import { CategoryModel } from "src/server/catalog/category.schema";
import { buildProductSearchText } from "src/server/catalog/product-search-text";
import { ProductModel } from "src/server/catalog/product.schema";
import { ReviewModel } from "src/server/catalog/review.schema";
import { CouponModel } from "src/server/commerce/coupon.schema";
import { HomeSectionModel } from "src/server/content/home-section.schema";
import { PageModel, PostModel } from "src/server/content/page.schema";
import { FaqModel, TestimonialModel } from "src/server/content/small-content.schema";
import { StoreSettingsModel } from "src/server/content/store-settings.schema";
import { assetProvider } from "src/server/core/assets";
import { connectToDatabase } from "src/server/core/db/connect";
import { htmlToText, sanitizeRichText } from "src/server/core/html/sanitize-html";
import { slugify } from "src/server/engines/normalize";
import { createImageImporter, type ImageImporter } from "./lib/image-importer";
import { internalHref } from "./lib/internal-href";
import type {
  LocalizedText,
  ReferenceSnapshot,
  ScrapedHomeSection,
  ScrapedImage,
  ScrapedProduct,
} from "./types";

const DATA_DIR = path.resolve(process.cwd(), "data/reference");
const OVERWRITE = process.argv.includes("--overwrite");
const SKIP_IMAGES = process.argv.includes("--skip-images");
const DRY_RUN = process.argv.includes("--dry-run");

const counts: Record<string, { created: number; updated: number; skipped: number }> = {};
const warnings: string[] = [];

function tally(kind: string, outcome: "created" | "updated" | "skipped") {
  counts[kind] ??= { created: 0, updated: 0, skipped: 0 };
  counts[kind]![outcome] += 1;
}

function log(message: string) {
  console.log(`[reference:seed] ${message}`);
}

const text = (value: LocalizedText | null | undefined): LocalizedText => ({ ar: value?.ar ?? "", en: value?.en ?? "" });

/** Rich HTML, sanitised; an EN copy identical to the AR one is a fallback, not a translation. */
function richText(value: LocalizedText): LocalizedText {
  const ar = sanitizeRichText(value.ar);
  const en = sanitizeRichText(value.en);
  return { ar, en: en === ar && /[؀-ۿ]/.test(en) ? "" : en };
}

/** Plain-text fallback for meta descriptions. */
const summary = (value: LocalizedText, max = 160): LocalizedText => ({
  ar: htmlToText(value.ar).slice(0, max),
  en: htmlToText(value.en).slice(0, max),
});

/**
 * Slugs from the reference URL. The EN side must be lower-case ASCII for the
 * DTO pattern; anything else falls back to the entity's English name, then to
 * `item-<id>`. Collisions get a `-<sallaId>` suffix.
 */
function slugPair(slug: LocalizedText, name: LocalizedText, sallaId: string, taken: { ar: Set<string>; en: Set<string> }) {
  const decode = (value: string) => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };
  let ar = slugify(decode(slug.ar)) || slugify(name.ar) || `item-${sallaId}`;
  let en = slugify(decode(slug.en)).replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!en) en = slugify(name.en).replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!en) en = `item-${sallaId}`;
  if (taken.ar.has(ar)) ar = `${ar}-${sallaId}`;
  if (taken.en.has(en)) en = `${en}-${sallaId}`;
  taken.ar.add(ar);
  taken.en.add(en);
  return { ar, en };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function takenSlugs(model: mongoose.Model<any>) {
  const docs = await model.find({}).select("slug legacy").lean<{ slug?: LocalizedText; legacy?: { sallaId?: string } }[]>();
  return {
    ar: new Set(docs.filter((doc) => !doc.legacy?.sallaId).map((doc) => doc.slug?.ar ?? "")),
    en: new Set(docs.filter((doc) => !doc.legacy?.sallaId).map((doc) => doc.slug?.en ?? "")),
  };
}

/**
 * Inserts a record keyed by its reference id, or updates it with --overwrite.
 * Returns the Mongo id either way.
 */
async function upsert(
  kind: string,
  model: mongoose.Model<any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  sallaId: string,
  data: Record<string, unknown>
): Promise<mongoose.Types.ObjectId | null> {
  const existing = await model.findOne({ "legacy.sallaId": sallaId }).select("_id").lean<{ _id: mongoose.Types.ObjectId }>();
  if (existing && !OVERWRITE) {
    tally(kind, "skipped");
    return existing._id;
  }
  if (DRY_RUN) {
    tally(kind, existing ? "updated" : "created");
    return existing?._id ?? new mongoose.Types.ObjectId();
  }
  try {
    if (existing) {
      await model.updateOne({ _id: existing._id }, { $set: data });
      tally(kind, "updated");
      return existing._id;
    }
    const [created] = await model.create([{ ...data, legacy: { sallaId } }]);
    tally(kind, "created");
    return (created as unknown as { _id: mongoose.Types.ObjectId })._id;
  } catch (error) {
    warnings.push(`${kind} ${sallaId}: ${(error as Error).message}`);
    return null;
  }
}

async function main() {
  const snapshot = JSON.parse(await readFile(path.join(DATA_DIR, "snapshot.json"), "utf8")) as ReferenceSnapshot;
  log(`snapshot from ${snapshot.scrapedAt}: ${snapshot.products.length} products, ${snapshot.categories.length} categories, ${snapshot.brands.length} brands`);

  await connectToDatabase();

  let provider: AssetProvider | null = null;
  if (!SKIP_IMAGES) {
    provider = assetProvider();
    if (!provider) {
      throw new Error(
        "Cloudinary is not configured (CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET). " +
          "Configure it, or run with --skip-images to import without images."
      );
    }
  } else {
    console.warn("[reference:seed] --skip-images: every image field is left EMPTY. Re-run without it once Cloudinary is configured (use --overwrite to fill existing records).");
  }

  const images: ImageImporter = await createImageImporter({
    provider: DRY_RUN ? null : provider,
    mapFile: path.join(DATA_DIR, "image-map.json"),
    onWarning: (message) => warnings.push(message),
  });
  const image = (source: ScrapedImage | null | undefined, folder: string): Promise<ImageAsset | null> =>
    source?.sourceUrl ? images.import(source.sourceUrl, folder) : Promise.resolve(null);

  // ─── Brands ───────────────────────────────────────────────────────────────
  const brandIds = new Map<string, mongoose.Types.ObjectId>();
  const brandSlugs = await takenSlugs(BrandModel as never);
  for (const brand of snapshot.brands) {
    const id = await upsert("brands", BrandModel as never, brand.sallaId, {
      name: text(brand.name),
      slug: slugPair(brand.slug, brand.name, brand.sallaId, brandSlugs),
      logo: await image(brand.logo, "ztes/brands"),
      description: richText(brand.description),
      sortOrder: brand.sortOrder,
      isActive: true,
      seo: { title: text(brand.name), description: summary(brand.description) },
    });
    if (id) brandIds.set(brand.sallaId, id);
  }

  // ─── Categories (parents before children) ─────────────────────────────────
  const categoryIds = new Map<string, mongoose.Types.ObjectId>();
  const categorySlugs = await takenSlugs(CategoryModel as never);
  for (const category of [...snapshot.categories].sort((a, b) => a.level - b.level)) {
    const parent = category.parentSallaId ? categoryIds.get(category.parentSallaId) ?? null : null;
    if (category.parentSallaId && !parent) warnings.push(`category ${category.sallaId}: parent ${category.parentSallaId} not imported; placed at the root.`);
    const id = await upsert("categories", CategoryModel as never, category.sallaId, {
      name: text(category.name),
      slug: slugPair(category.slug, category.name, category.sallaId, categorySlugs),
      description: { ar: "", en: "" },
      parent,
      icon: await image(category.icon, "ztes/categories"),
      image: await image(category.image, "ztes/categories"),
      banner: await image(category.banner, "ztes/categories"),
      sortOrder: category.sortOrder,
      isActive: true,
      showInMenu: true,
      seo: { title: text(category.name), description: { ar: "", en: "" } },
    });
    if (id) categoryIds.set(category.sallaId, id);
  }

  // ─── Products + their reviews ─────────────────────────────────────────────
  const productIds = new Map<string, mongoose.Types.ObjectId>();
  const productSlugs = await takenSlugs(ProductModel as never);
  let processed = 0;
  for (const product of snapshot.products) {
    const id = await upsert("products", ProductModel as never, product.sallaId, await productData(product));
    if (id) productIds.set(product.sallaId, id);
    if (id && !DRY_RUN) await seedReviews(product, id);
    if (++processed % 100 === 0) log(`products: ${processed}/${snapshot.products.length}`);
  }

  async function productData(product: ScrapedProduct) {
    const categories = product.categoryIds.map((sallaId) => categoryIds.get(sallaId)).filter((id): id is mongoose.Types.ObjectId => Boolean(id));
    const primary = (product.primaryCategoryId && categoryIds.get(product.primaryCategoryId)) || categories[0] || null;
    const brand = product.brandSallaId ? brandIds.get(product.brandSallaId) ?? null : null;
    const price = toMoney(product.price || "0");
    const compareAt = product.compareAtPrice ? toMoney(product.compareAtPrice) : null;
    const name = text(product.name);
    const galleryImages: ImageAsset[] = [];
    for (const source of product.images) {
      const asset = await image(source, "ztes/products");
      if (asset) galleryImages.push(asset);
    }
    const options = [];
    for (const group of product.options) {
      const values = [];
      for (const value of group.values) {
        values.push({
          label: text(value.name),
          priceDelta: toMoney(value.additionalPrice || "0"),
          image: await image(value.image, "ztes/products"),
          isAvailable: value.isAvailable,
          sortOrder: value.sortOrder,
        });
      }
      options.push({
        name: text(group.name),
        type: group.type === "thumbnail" ? ProductOptionType.THUMBNAIL : ProductOptionType.TEXT,
        required: group.required,
        values,
      });
    }
    return {
      name,
      slug: slugPair(product.slug, product.name, product.sallaId, productSlugs),
      description: richText(product.description),
      ...(product.sku ? { sku: product.sku } : {}),
      brand,
      categories,
      primaryCategory: primary,
      images: galleryImages,
      price,
      compareAtPrice: compareAt && compareAt.greaterThan(price) ? compareAt : null,
      // The reference does not expose quantities, only in/out of stock.
      stock: product.availability === "in_stock" ? 100 : 0,
      trackStock: true,
      weight: text(product.weight),
      options,
      badge: product.badgeText ? { label: text(product.badgeText), tone: BadgeTone.PRIMARY } : null,
      quantityTiers: [],
      isActive: true,
      ratingBaseline: { average: product.ratingAverage, count: product.ratingCount },
      ratingAverage: product.ratingAverage,
      ratingCount: product.ratingCount,
      soldCount: product.soldCount ?? 0,
      searchText: buildProductSearchText({ name, sku: product.sku, brandName: product.brandName }),
      seo: { title: name, description: summary(product.description) },
    };
  }

  async function seedReviews(product: ScrapedProduct, productId: mongoose.Types.ObjectId) {
    for (const review of product.reviews) {
      await upsert("reviews", ReviewModel as never, review.legacyId, {
        product: productId,
        authorName: review.authorName || "عميل",
        rating: Math.min(5, Math.max(1, Math.round(review.rating || 5))),
        body: review.body,
        isPublished: true,
        reviewedAt: review.reviewedAt ? new Date(review.reviewedAt) : new Date(),
      });
    }
  }

  // ─── Pages, posts ─────────────────────────────────────────────────────────
  const pageSlugs = await takenSlugs(PageModel as never);
  for (const [index, page] of snapshot.pages.entries()) {
    await upsert("pages", PageModel as never, page.sallaId, {
      title: text(page.title),
      slug: slugPair(page.slug, page.title, page.sallaId, pageSlugs),
      body: richText(page.body),
      isActive: true,
      showInFooter: true,
      sortOrder: index,
      seo: { title: text(page.title), description: summary(page.body) },
    });
  }

  const postIds = new Map<string, mongoose.Types.ObjectId>();
  const postSlugs = await takenSlugs(PostModel as never);
  const seenPosts = new Set<string>();
  for (const post of snapshot.posts) {
    if (seenPosts.has(post.sallaId)) continue;
    seenPosts.add(post.sallaId);
    // Arabic-only on the reference: an English slug is still required, so it is derived.
    const id = await upsert("posts", PostModel as never, post.sallaId, {
      title: text(post.title),
      slug: slugPair({ ar: post.slug.ar, en: `post-${post.sallaId}` }, post.title, post.sallaId, postSlugs),
      excerpt: text(post.excerpt),
      body: richText(post.body),
      cover: await image(post.cover, "ztes/posts"),
      isPublished: true,
      publishedAt: post.publishedAt ? new Date(post.publishedAt) : new Date(),
      seo: { title: text(post.title), description: summary(post.excerpt) },
    });
    if (id) postIds.set(post.sallaId, id);
  }

  // ─── FAQs, testimonials (AR + EN paired by position) ──────────────────────
  const enFaqs = snapshot.home.en.find((section) => section.payload.type === "FAQ");
  const enFaqItems = enFaqs?.payload.type === "FAQ" ? enFaqs.payload.items : [];
  for (const [index, faq] of snapshot.faqs.entries()) {
    await upsert("faqs", FaqModel as never, `faq:${index}`, {
      question: { ar: faq.question.ar, en: enFaqItems[index]?.question.ar ?? "" },
      answer: { ar: faq.answer.ar, en: enFaqItems[index]?.answer.ar ?? "" },
      sortOrder: index,
      isActive: true,
    });
  }
  for (const [index, testimonial] of snapshot.testimonials.entries()) {
    if (!testimonial.body.trim()) continue;
    await upsert("testimonials", TestimonialModel as never, `testimonial:${index}`, {
      authorName: testimonial.authorName || "عميل",
      // Customer words are shown as written in every locale.
      body: { ar: testimonial.body, en: testimonial.body },
      rating: Math.min(5, Math.max(1, testimonial.rating || 5)),
      sortOrder: index,
      isActive: true,
    });
  }

  // ─── Coupons ──────────────────────────────────────────────────────────────
  for (const coupon of snapshot.coupons) {
    await upsert("coupons", CouponModel as never, `coupon:${coupon.code}`, {
      code: coupon.code.toUpperCase(),
      description: text(coupon.description),
      type: CouponType.PERCENT,
      value: toMoney(coupon.value),
      isActive: true,
    });
  }

  // ─── Settings (singleton) ─────────────────────────────────────────────────
  const settings = snapshot.settings;
  const branchesSection = snapshot.home.ar.find((section) => section.payload.type === "BRANCH_MAP");
  const enBranchesSection = snapshot.home.en.find((section) => section.payload.type === "BRANCH_MAP");
  const branches =
    branchesSection?.payload.type === "BRANCH_MAP"
      ? branchesSection.payload.branches.map((branch, index) => ({
          name: {
            ar: branch.name.ar,
            en: enBranchesSection?.payload.type === "BRANCH_MAP" ? enBranchesSection.payload.branches[index]?.name.ar ?? "" : "",
          },
          address: { ar: "", en: "" },
          hours: { ar: "السبت – الخميس ٩ ص – ١٠ م", en: "Sat – Thu, 9 am – 10 pm" },
          phone: "",
          mapUrl: "",
          mapEmbedUrl: branch.mapEmbedUrl,
        }))
      : [];
  const social = settings.social ?? {};
  const existingSettings = await StoreSettingsModel.findOne({}).select("_id storeName").lean<{ _id: mongoose.Types.ObjectId; storeName?: LocalizedText }>();
  const settingsAreDefault = !existingSettings || existingSettings.storeName?.en === "ZTES";
  if (settingsAreDefault || OVERWRITE) {
    const data = {
      storeName: { ar: settings.storeName.ar, en: "ORKIDA Agricultural Pesticides" },
      tagline: { ar: "حلول تثق بها", en: "Solutions you trust" },
      logo: await image(settings.logo, "ztes/settings"),
      favicon: await image(settings.favicon, "ztes/settings"),
      contact: { ...settings.contact, address: { ar: "الرياض، المملكة العربية السعودية", en: "Riyadh, Saudi Arabia" } },
      social: {
        instagram: social.instagram ?? "",
        x: social.twitter ?? social.x ?? "",
        tiktok: social.tiktok ?? "",
        facebook: social.facebook ?? "",
        youtube: social.youtube ?? "",
        snapchat: social.snapchat ?? "",
      },
      legal: {
        vatNumber: settings.legal.vatNumber,
        crNumber: settings.legal.crNumber,
        vatCertificate: await image(settings.legal.vatCertificate, "ztes/settings"),
      },
      announcements: settings.announcements,
      footerDescription: { ar: settings.footerDescription.ar, en: "" },
      delivery: {
        city: { ar: "الرياض", en: "Riyadh" },
        fee: toMoney("9.00"),
        freeShippingThreshold: toMoney("199.00"),
        estimate: { ar: "توصيل خلال 24–48 ساعة داخل الرياض", en: "Delivered within 24–48 hours in Riyadh" },
      },
      vatRate: 15,
      safeUseTitle: { ar: "إقرار الاستخدام الآمن", en: "Safe use acknowledgement" },
      safeUseText: {
        ar: "المبيدات تُستخدم حسب الملصق وبعيدًا عن الأطفال",
        en: "Pesticides are used according to the label and kept away from children",
      },
      branches,
      popup: { isActive: false, title: { ar: "", en: "" }, body: { ar: "", en: "" }, image: null, ctaLabel: { ar: "", en: "" }, ctaHref: "" },
      seo: {
        title: { ar: settings.storeName.ar, en: "ORKIDA Agricultural Pesticides" },
        description: { ar: settings.footerDescription.ar.slice(0, 160), en: "" },
      },
    };
    if (!DRY_RUN) await StoreSettingsModel.updateOne({}, { $set: data }, { upsert: true });
    tally("settings", existingSettings ? "updated" : "created");
  } else {
    tally("settings", "skipped");
  }

  // ─── Home sections ────────────────────────────────────────────────────────
  const homeCount = await HomeSectionModel.countDocuments();
  if (homeCount === 0 || OVERWRITE) {
    if (!DRY_RUN && OVERWRITE) await HomeSectionModel.deleteMany({});
    for (const [index, section] of snapshot.home.ar.entries()) {
      const en = snapshot.home.en[index];
      const doc = await homeSectionDoc(section, en?.payload.type === section.payload.type ? en : undefined);
      if (!doc) continue;
      if (!DRY_RUN) await HomeSectionModel.create({ ...doc, sortOrder: index, isActive: true });
      tally("homeSections", "created");
    }
  } else {
    tally("homeSections", "skipped");
  }

  async function homeSectionDoc(section: ScrapedHomeSection, en: ScrapedHomeSection | undefined) {
    const title = { ar: section.title.ar, en: en?.title.ar ?? "" };
    const payload = section.payload;
    const mediaItems = async (items: typeof payload extends { items: infer I } ? I : never) => items;
    void mediaItems;
    switch (payload.type) {
      case "HERO_SLIDER":
      case "TILE_ROW":
      case "BANNER":
      case "TRUST_STRIP": {
        const enItems = en && "items" in en.payload ? (en.payload.items as { title: LocalizedText; subtitle: LocalizedText }[]) : [];
        const items = [];
        for (const [i, item] of payload.items.entries()) {
          items.push({
            _id: new mongoose.Types.ObjectId().toHexString(),
            image: await image(item.image, "ztes/home"),
            mobileImage: await image(item.mobileImage, "ztes/home"),
            title: { ar: item.title.ar, en: enItems[i]?.title.ar ?? "" },
            subtitle: { ar: item.subtitle.ar, en: enItems[i]?.subtitle.ar ?? "" },
            href: internalHref(item.href),
          });
        }
        return { type: HomeSectionType[payload.type], title, payload: { items } };
      }
      case "BRAND_CAROUSEL":
        return {
          type: HomeSectionType.BRAND_CAROUSEL,
          title,
          payload: { brands: payload.brandSallaIds.map((id) => brandIds.get(id)).filter(Boolean).map(String) },
        };
      case "SPOTLIGHT": {
        const product = payload.productSallaId ? productIds.get(payload.productSallaId) : undefined;
        if (!product) {
          warnings.push(`SPOTLIGHT product ${payload.productSallaId} not imported; section skipped.`);
          return null;
        }
        return {
          type: HomeSectionType.SPOTLIGHT,
          title,
          payload: {
            product: String(product),
            videoUrl: payload.videoUrl ?? "",
            couponCode: payload.couponCode ?? snapshot.coupons[0]?.code ?? "",
            endsAt: payload.endsAt,
          },
        };
      }
      case "PRODUCT_RAIL":
        if (payload.source === "CATEGORY") {
          const category = payload.categorySallaIds.map((id) => categoryIds.get(id)).find(Boolean);
          if (!category) {
            warnings.push(`PRODUCT_RAIL "${section.title.ar}": no category imported; section skipped.`);
            return null;
          }
          return { type: HomeSectionType.PRODUCT_RAIL, title, payload: { source: ProductRailSource.CATEGORY, category: String(category), limit: payload.limit } };
        }
        return {
          type: HomeSectionType.PRODUCT_RAIL,
          title,
          payload: {
            source: ProductRailSource.PRODUCTS,
            products: payload.productSallaIds.map((id) => productIds.get(id)).filter(Boolean).map(String),
            limit: Math.max(payload.limit, payload.productSallaIds.length),
          },
        };
      case "FAQ":
      case "TESTIMONIALS":
      case "BRANCH_MAP":
      case "SOCIAL_LINKS":
        return { type: HomeSectionType[payload.type], title, payload: {} };
      case "BLOG_RAIL":
        return { type: HomeSectionType.BLOG_RAIL, title, payload: { limit: Math.max(4, payload.postSallaIds.length) } };
    }
  }

  // Resolve `category:<sallaId>` / `product:` / `brand:` markers to localized-slug paths.
  if (!DRY_RUN) {
    const sections = await HomeSectionModel.find({}).lean();
    for (const section of sections) {
      const items = (section.payload?.items ?? []) as { href: string }[];
      let changed = false;
      for (const item of items) {
        const marker = /^(category|product|brand):(\d+)$/.exec(item.href ?? "");
        if (!marker) continue;
        const [, kind, sallaId] = marker;
        const model = kind === "category" ? CategoryModel : kind === "product" ? ProductModel : BrandModel;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const target = await (model as unknown as mongoose.Model<any>).findOne({ "legacy.sallaId": sallaId }).select("slug").lean<{ slug: LocalizedText }>();
        const base = kind === "category" ? "/categories" : kind === "product" ? "/products" : "/brands";
        item.href = target ? `${base}/${target.slug.ar}` : "";
        changed = true;
      }
      if (changed) await HomeSectionModel.updateOne({ _id: section._id }, { $set: { "payload.items": items } });
    }
  }

  await images.flush();
  await writeFile(path.join(DATA_DIR, "seed-report.json"), JSON.stringify({ at: new Date().toISOString(), counts, warnings }, null, 2));
  log(`done${DRY_RUN ? " (dry run)" : ""}: ${JSON.stringify(counts)}`);
  log(`${warnings.length} warnings — see data/reference/seed-report.json`);
}

main()
  .catch((error) => {
    console.error("[reference:seed] fatal:", error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
