/**
 * Reference-store importer, stage 1: scrape orkidastore.com into a normalised
 * local JSON snapshot under `data/reference/*.json` (never committed —
 * gitignored). Run: `npm run reference:scrape` (add `--refresh` to bypass
 * the raw-HTML cache under `data/reference/raw/`).
 *
 * This file is the orchestrator only — every actual parsing rule lives in
 * `parse/*.ts` as a pure, independently-tested function. See those modules'
 * doc comments for what was verified against the live site and what is a
 * documented best-effort heuristic.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchHtml, normalizeSitemapUrl, withPoliteConcurrency } from "./lib/http";
import { extractSlugFromUrl, splitBilingualLabel } from "./lib/html-utils";
import { flattenMenuTree, parseCategoryMenu, sallaIdFromCategoryHref } from "./parse/category-menu";
import { parseBrandDetail, parseBrandIndex } from "./parse/brand";
import { parseProductPage } from "./parse/product";
import { parseStaticPage } from "./parse/page";
import { parseBlogPost } from "./parse/post";
import { parseHomePage } from "./parse/home";
import { extractAnnouncement, extractPopupRawHtml, extractStoreConfigFacts } from "./parse/settings";
import { extractStaticPageUrls, groupSitemapUrlsById, parseSitemapLocs } from "./parse/sitemap";
import type {
  LocalizedText,
  QuantityTierFinding,
  ReferenceSnapshot,
  ScrapeReport,
  ScrapedBrand,
  ScrapedCategory,
  ScrapedCoupon,
  ScrapedHomeSection,
  ScrapedPage,
  ScrapedPost,
  ScrapedProduct,
  ScrapedSettings,
} from "./types";

const BASE = "https://orkidastore.com";
const REFRESH = process.argv.includes("--refresh");
const OUT_DIR = path.resolve(process.cwd(), "data/reference");

const warnings: string[] = [];
const unmatchedCategoryNames = new Set<string>();

function log(message: string): void {
  console.log(`[reference:scrape] ${new Date().toISOString()} ${message}`);
}

async function get(url: string, kind: string, cacheFile: string): Promise<string> {
  return fetchHtml(url, { kind, cacheFile, refresh: REFRESH });
}

// ---------------------------------------------------------------------------
// Categories (from the AR + EN home page nav menus — the sitemap indexes
// only a subset, see report.json)
// ---------------------------------------------------------------------------

async function scrapeCategories(homeArHtml: string, homeEnHtml: string): Promise<{ categories: ScrapedCategory[]; nameIndex: CategoryNameIndex }> {
  const arTree = flattenMenuTree(parseCategoryMenu(homeArHtml));
  const enTree = flattenMenuTree(parseCategoryMenu(homeEnHtml));
  const enById = new Map(enTree.map((node) => [node.sallaId, node]));

  log(`category menu: ${arTree.length} AR nodes, ${enTree.length} EN nodes`);

  const categories: ScrapedCategory[] = await withPoliteConcurrency(
    arTree,
    async (node) => {
      const enNode = enById.get(node.sallaId);
      if (!enNode) warnings.push(`Category ${node.sallaId} (${node.name}) has no EN nav counterpart; EN name/slug fall back to AR.`);

      let banner: ScrapedCategory["banner"] = null;
      let image: ScrapedCategory["image"] = null;
      try {
        const categoryHtml = await get(node.href, "category", `${node.sallaId}.ar.html`);
        const bannerMatch = /cat-slider-banner[\s\S]{0,400}?data-src="([^"]+)"/.exec(categoryHtml);
        const ogImageMatch = /<meta property="og:image" content="([^"]+)"/.exec(categoryHtml);
        if (bannerMatch) banner = { sourceUrl: bannerMatch[1]! };
        if (ogImageMatch) image = { sourceUrl: ogImageMatch[1]! };
      } catch (error) {
        warnings.push(`Category ${node.sallaId} page fetch failed: ${(error as Error).message}`);
      }

      const category: ScrapedCategory = {
        sallaId: node.sallaId,
        name: { ar: node.name, en: enNode?.name ?? node.name },
        slug: { ar: extractSlugFromUrl(node.href), en: extractSlugFromUrl(enNode?.href ?? node.href) },
        parentSallaId: node.parentSallaId,
        level: node.level,
        sortOrder: node.sortOrder,
        icon: node.iconUrl ? { sourceUrl: node.iconUrl } : null,
        banner,
        image,
      };
      return category;
    },
    { concurrency: 1, delayMs: 1500 }
  );

  const nameIndex = buildCategoryNameIndex(categories);
  return { categories, nameIndex };
}

interface CategoryNameIndex {
  byArName: Map<string, string[]>;
  byEnName: Map<string, string[]>;
  levelById: Map<string, number>;
}

function normalizeForMatch(name: string): string {
  return name.trim().toLowerCase();
}

function buildCategoryNameIndex(categories: ScrapedCategory[]): CategoryNameIndex {
  const byArName = new Map<string, string[]>();
  const byEnName = new Map<string, string[]>();
  const levelById = new Map<string, number>();
  for (const category of categories) {
    levelById.set(category.sallaId, category.level);
    const arKey = normalizeForMatch(category.name.ar);
    const enKey = normalizeForMatch(category.name.en);
    byArName.set(arKey, [...(byArName.get(arKey) ?? []), category.sallaId]);
    byEnName.set(enKey, [...(byEnName.get(enKey) ?? []), category.sallaId]);
  }
  return { byArName, byEnName, levelById };
}

/** Resolves a product's `product:category` name list to category ids + a primaryCategory pick. */
function resolveProductCategories(
  index: CategoryNameIndex,
  arNames: string[],
  enNames: string[]
): { categoryIds: string[]; primaryCategoryId: string | null } {
  const resolved: string[] = [];
  for (let i = 0; i < arNames.length; i++) {
    const arName = arNames[i]!;
    const enName = enNames[i];
    let candidates = index.byArName.get(normalizeForMatch(arName)) ?? [];
    if (candidates.length > 1 && enName) {
      const enCandidates = index.byEnName.get(normalizeForMatch(enName)) ?? [];
      const intersection = candidates.filter((id) => enCandidates.includes(id));
      if (intersection.length > 0) candidates = intersection;
    }
    if (candidates.length === 0) {
      unmatchedCategoryNames.add(arName);
      continue;
    }
    if (candidates.length > 1) {
      warnings.push(`Category name "${arName}" matches ${candidates.length} categories; using the first (${candidates[0]}).`);
    }
    const id = candidates[0]!;
    if (!resolved.includes(id)) resolved.push(id);
  }

  // Primary = deepest matched level (most specific), tie-broken by last position (Salla lists
  // categories from most- to least-specific in `product:category`, per the observed sample).
  let primaryCategoryId: string | null = null;
  let bestLevel = -1;
  for (let i = resolved.length - 1; i >= 0; i--) {
    const level = index.levelById.get(resolved[i]!) ?? 0;
    if (level > bestLevel) {
      bestLevel = level;
      primaryCategoryId = resolved[i]!;
    }
  }

  return { categoryIds: resolved, primaryCategoryId };
}

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------

async function scrapeBrands(): Promise<{ brands: ScrapedBrand[]; nameToId: Map<string, string> }> {
  const indexHtml = await get(`${BASE}/ar/brands`, "brand", "_index.ar.html");
  const entries = parseBrandIndex(indexHtml);
  log(`brand index: ${entries.length} brands`);

  const brands: ScrapedBrand[] = await withPoliteConcurrency(
    entries,
    async (entry) => {
      const arHtml = await get(entry.href, "brand", `${entry.sallaId}.ar.html`).catch((error: Error) => {
        warnings.push(`Brand ${entry.sallaId} AR page failed: ${error.message}`);
        return "";
      });
      const enHtml = await get(`${BASE}/en/x/brand-${entry.sallaId}`, "brand", `${entry.sallaId}.en.html`).catch((error: Error) => {
        warnings.push(`Brand ${entry.sallaId} EN page failed: ${error.message}`);
        return "";
      });
      const arDetail = parseBrandDetail(arHtml);
      const enDetail = parseBrandDetail(enHtml);

      return {
        sallaId: entry.sallaId,
        name: entry.name,
        // AR slug from the index href (reliable); EN slug from the redirected EN page's own URL is
        // not captured post-redirect by a plain fetch, so this reuses the AR slug with a
        // `-<id>` suffix at seed time if a collision occurs (documented in seed.ts).
        slug: { ar: extractSlugFromUrl(entry.href), en: extractSlugFromUrl(entry.href) },
        logo: entry.logoUrl ? { sourceUrl: entry.logoUrl } : null,
        description: { ar: arDetail.metaDescription, en: enDetail.metaDescription },
        sortOrder: entry.sortOrder,
      } satisfies ScrapedBrand;
    },
    { concurrency: 1, delayMs: 1500 }
  );

  const nameToId = new Map<string, string>();
  for (const brand of brands) {
    nameToId.set(normalizeForMatch(brand.name.ar), brand.sallaId);
    nameToId.set(normalizeForMatch(brand.name.en), brand.sallaId);
  }
  return { brands, nameToId };
}

/** A richer brand description found embedded in a product's ld+json — replaces the plain meta-description fallback. */
function upgradeBrandDescriptionsFromProducts(brands: ScrapedBrand[], nameToId: Map<string, string>, products: { brandNameRaw: string | null; brandDescriptionHtml: string | null }[]): void {
  const byId = new Map(brands.map((brand) => [brand.sallaId, brand]));
  for (const product of products) {
    if (!product.brandNameRaw || !product.brandDescriptionHtml) continue;
    const id = nameToId.get(normalizeForMatch(product.brandNameRaw));
    if (!id) continue;
    const brand = byId.get(id);
    if (!brand) continue;
    // Whichever side of the bilingual label this product's page was fetched in owns that slot.
    const { ar, en } = splitBilingualLabel(product.brandNameRaw);
    if (ar && (!brand.description.ar || brand.description.ar.length < product.brandDescriptionHtml.length)) {
      brand.description.ar = product.brandDescriptionHtml;
    }
    void en;
  }
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

interface ProductScrapeResult {
  product: ScrapedProduct;
  brandNameRaw: string | null;
  brandDescriptionHtml: string | null;
  couponCode: string | null;
}

let processedProducts = 0;

async function scrapeProducts(productPairs: { id: string; ar: string | null; en: string | null }[], categoryIndex: CategoryNameIndex, brandNameToId: Map<string, string>) {
  const results = await withPoliteConcurrency(
    productPairs,
    async (pair): Promise<ProductScrapeResult | null> => {
      if (!pair.ar) {
        warnings.push(`Product ${pair.id} has no AR sitemap URL; skipped.`);
        return null;
      }
      let arHtml: string;
      try {
        arHtml = await get(normalizeSitemapUrl(pair.ar), "product", `${pair.id}.ar.html`);
      } catch (error) {
        warnings.push(`Product ${pair.id} AR page failed (${(error as Error).message}); skipped — re-run to retry.`);
        return null;
      }
      let arParsed: ReturnType<typeof parseProductPage>;
      try {
        arParsed = parseProductPage(arHtml);
      } catch (error) {
        warnings.push(`Product ${pair.id} AR page could not be parsed (${(error as Error).message}); skipped.`);
        return null;
      }
      const enHtml = pair.en
        ? await get(normalizeSitemapUrl(pair.en), "product", `${pair.id}.en.html`).catch((error: Error) => {
            warnings.push(`Product ${pair.id} EN page failed (${error.message}); EN falls back to AR.`);
            return null;
          })
        : null;
      let enParsed: ReturnType<typeof parseProductPage> | null = null;
      try {
        enParsed = enHtml ? parseProductPage(enHtml) : null;
      } catch (error) {
        warnings.push(`Product ${pair.id} EN page could not be parsed (${(error as Error).message}); EN falls back to AR.`);
      }
      if ((processedProducts += 1) % 50 === 0) log(`products: ${processedProducts}/${productPairs.length}`);

      const { categoryIds, primaryCategoryId } = resolveProductCategories(
        categoryIndex,
        arParsed.categoryNames,
        enParsed?.categoryNames ?? []
      );

      const brandSallaId = arParsed.brandName ? (brandNameToId.get(normalizeForMatch(splitBilingualLabel(arParsed.brandName).ar)) ?? brandNameToId.get(normalizeForMatch(splitBilingualLabel(arParsed.brandName).en)) ?? null) : null;
      if (arParsed.brandName && !brandSallaId) {
        warnings.push(`Product ${pair.id} brand "${arParsed.brandName}" did not match any scraped brand.`);
      }

      const name: LocalizedText = { ar: arParsed.name, en: enParsed?.name || arParsed.name };
      const slug: LocalizedText = {
        ar: extractSlugFromUrl(pair.ar),
        en: pair.en ? extractSlugFromUrl(pair.en) : extractSlugFromUrl(pair.ar),
      };

      const product: ScrapedProduct = {
        sallaId: pair.id,
        name,
        description: { ar: arParsed.descriptionHtml, en: enParsed?.descriptionHtml || arParsed.descriptionHtml },
        slug,
        sku: arParsed.modelNumber ?? undefined,
        brandName: arParsed.brandName ? { ar: splitBilingualLabel(arParsed.brandName).ar, en: splitBilingualLabel(arParsed.brandName).en } : null,
        brandSallaId,
        categoryNames: { ar: arParsed.categoryNames, en: enParsed?.categoryNames ?? [] },
        categoryIds,
        primaryCategoryId,
        price: arParsed.price ?? "0",
        compareAtPrice: arParsed.compareAtPrice,
        availability: arParsed.availability,
        images: arParsed.images.map((image) => ({ sourceUrl: image.url, alt: image.alt })),
        options: arParsed.options.map((group, groupIndex) => {
          const enGroup = enParsed?.options[groupIndex];
          return {
            name: { ar: group.name, en: enGroup?.name ?? group.name },
            type: group.type,
            required: group.required,
            values: group.details.map((value, valueIndex) => {
              const enValue = enGroup?.details[valueIndex];
              return {
                name: { ar: value.name, en: enValue?.name ?? value.name },
                additionalPrice: String(value.additional_price ?? 0),
                image: value.image ? { sourceUrl: value.image } : null,
                isAvailable: !value.is_out,
                sortOrder: valueIndex,
              };
            }),
          };
        }),
        weight: { ar: arParsed.weightText ?? "", en: enParsed?.weightText ?? arParsed.weightText ?? "" },
        soldCount: arParsed.soldCount,
        ratingAverage: arParsed.aggregateRating.average,
        ratingCount: arParsed.aggregateRating.count,
        reviews: arParsed.reviews.map((review) => ({
          legacyId: `${pair.id}:${review.authorName}:${review.date}`,
          authorName: review.authorName || "عميل",
          rating: review.rating,
          body: review.body,
          reviewedAt: review.date,
        })),
        badgeText: null,
      };

      return {
        product,
        brandNameRaw: arParsed.brandName,
        brandDescriptionHtml: arParsed.brandDescriptionHtml,
        couponCode: arParsed.couponCode,
      };
    },
    { concurrency: 1, delayMs: 1500 }
  );

  return results.filter((result): result is ProductScrapeResult => result !== null);
}

// ---------------------------------------------------------------------------
// Static pages, blog posts
// ---------------------------------------------------------------------------

async function scrapePages(pageUrlPairs: { ar: string; en: string | null }[]): Promise<ScrapedPage[]> {
  const results = await withPoliteConcurrency(
    pageUrlPairs,
    async (pair): Promise<ScrapedPage | null> => {
      let arHtml: string;
      try {
        arHtml = await get(normalizeSitemapUrl(pair.ar), "page", `${slugKey(pair.ar)}.ar.html`);
      } catch (error) {
        warnings.push(`Static page ${pair.ar} fetch failed (${(error as Error).message}); skipped.`);
        return null;
      }
      const arParsed = parseStaticPage(arHtml);
      const enParsed = pair.en
        ? await get(normalizeSitemapUrl(pair.en), "page", `${slugKey(pair.ar)}.en.html`)
            .then(parseStaticPage)
            .catch((error: Error) => {
              warnings.push(`Static page ${pair.en} EN fetch failed (${error.message}); EN falls back to AR.`);
              return null;
            })
        : null;

      if (!arParsed.bodyHtml) warnings.push(`Static page "${arParsed.title}" (${arParsed.sallaId}) had no extractable body.`);

      return {
        sallaId: arParsed.sallaId ?? slugKey(pair.ar),
        title: { ar: arParsed.title, en: enParsed?.title || arParsed.title },
        slug: { ar: extractSlugFromUrl(pair.ar), en: pair.en ? extractSlugFromUrl(pair.en) : extractSlugFromUrl(pair.ar) },
        body: { ar: arParsed.bodyHtml, en: enParsed?.bodyHtml || "" },
      };
    },
    { concurrency: 1, delayMs: 1500 }
  );
  return results.filter((page): page is ScrapedPage => page !== null);
}

function slugKey(url: string): string {
  return extractSlugFromUrl(url).replace(/\//g, "-") || "page";
}

async function scrapePosts(postIds: string[]): Promise<ScrapedPost[]> {
  const results = await withPoliteConcurrency(
    postIds,
    async (id): Promise<ScrapedPost | null> => {
      let html: string;
      try {
        html = await get(`${BASE}/ar/x/a-${id}`, "post", `${id}.ar.html`);
      } catch (error) {
        warnings.push(`Blog post ${id} fetch failed (${(error as Error).message}); skipped.`);
        return null;
      }
      const parsed = parseBlogPost(html);
      if (!parsed.sallaId) warnings.push(`Blog post fetch for id ${id} did not resolve a canonical id.`);
      return {
        sallaId: parsed.sallaId ?? id,
        title: { ar: parsed.title, en: "" },
        slug: { ar: extractSlugFromUrl(`${BASE}/ar/x/a-${id}`), en: "" },
        excerpt: { ar: parsed.excerpt, en: "" },
        body: { ar: parsed.bodyHtml, en: "" },
        cover: parsed.coverImageUrl ? { sourceUrl: parsed.coverImageUrl } : null,
        publishedAt: parsed.publishedAt,
      };
    },
    { concurrency: 1, delayMs: 1500 }
  );
  return results.filter((post): post is ScrapedPost => post !== null);
}

// ---------------------------------------------------------------------------
// Home sections, settings
// ---------------------------------------------------------------------------

function buildHomeSections(homeHtml: string, allBrandIds: string[]): ScrapedHomeSection[] {
  const parsed = parseHomePage(homeHtml);
  const sections: (ScrapedHomeSection & { position: number })[] = [];
  const sortOrder = 0;
  const at = (position: number) => ({ position });

  if (parsed.heroSlides.length > 0) {
    sections.push({
      ...at(parsed.positions.hero),
      title: { ar: "", en: "" },
      sortOrder,
      payload: {
        type: "HERO_SLIDER",
        items: parsed.heroSlides.map((slide) => ({
          image: slide.imageUrl ? { sourceUrl: slide.imageUrl } : null,
          title: { ar: slide.title, en: "" },
          subtitle: { ar: slide.subtitle, en: "" },
          href: slide.href,
        })),
      },
    });
  }

  if (parsed.brandCarouselHrefs.length > 0) {
    const ids = parsed.brandCarouselHrefs
      .map((href) => /brand-(\d+)/.exec(href)?.[1])
      .filter((id): id is string => Boolean(id));
    sections.push({
      ...at(parsed.positions.brands),
      title: { ar: "", en: "" },
      sortOrder: sortOrder,
      // Empty = "every active brand" per the schema's own convention when the carousel's id list
      // covers all scraped brands (observed: it does, on the reference).
      payload: { type: "BRAND_CAROUSEL", brandSallaIds: ids.length === allBrandIds.length ? [] : ids },
    });
  }

  for (const banner of parsed.bannerGroups) {
    const isTileRow = banner.items.length >= 3;
    if (banner.items.length === 0) continue;
    sections.push({
      ...at(banner.position),
      title: { ar: banner.title, en: "" },
      sortOrder,
      payload: {
        type: isTileRow ? "TILE_ROW" : "BANNER",
        items: banner.items.map((item) => ({
          image: item.imageUrl ? { sourceUrl: item.imageUrl } : null,
          title: { ar: item.title, en: "" },
          subtitle: { ar: item.subtitle, en: "" },
          href: item.href,
        })),
      },
    });
  }

  for (const spotlight of parsed.spotlights) {
    sections.push({
      ...at(spotlight.position),
      title: { ar: "", en: "" },
      sortOrder: sortOrder,
      payload: {
        type: "SPOTLIGHT",
        productSallaId: spotlight.productSallaId,
        videoUrl: spotlight.videoUrl,
        couponCode: spotlight.couponCode,
        endsAt: spotlight.endsAt,
      },
    });
  }

  for (const rail of parsed.productRails) {
    sections.push({
      ...at(rail.position),
      title: { ar: rail.title, en: "" },
      sortOrder,
      payload: {
        type: "PRODUCT_RAIL",
        source: rail.source === "categories" ? "CATEGORY" : "PRODUCTS",
        categorySallaIds: rail.source === "categories" ? rail.ids : [],
        productSallaIds: rail.source === "selected" ? rail.ids : [],
        limit: rail.limit,
      },
    });
  }

  if (parsed.trustItems.length > 0) {
    sections.push({
      ...at(parsed.positions.trust),
      title: { ar: "", en: "" },
      sortOrder,
      payload: {
        type: "TRUST_STRIP",
        items: parsed.trustItems.map((item) => ({
          image: item.iconUrl ? { sourceUrl: item.iconUrl } : null,
          title: { ar: item.title, en: "" },
          subtitle: { ar: item.subtitle, en: "" },
          href: "",
        })),
      },
    });
  }

  if (parsed.faqs.length > 0) {
    sections.push({
      ...at(parsed.positions.faqs),
      title: { ar: "", en: "" },
      sortOrder: sortOrder,
      payload: { type: "FAQ", items: parsed.faqs.map((faq) => ({ question: { ar: faq.question, en: "" }, answer: { ar: faq.answer, en: "" } })) },
    });
  }

  if (parsed.blogPostIds.length > 0) {
    sections.push({ ...at(parsed.positions.blog), title: { ar: "", en: "" }, sortOrder, payload: { type: "BLOG_RAIL", postSallaIds: parsed.blogPostIds } });
  }

  if (parsed.testimonials.length > 0) {
    sections.push({
      ...at(parsed.positions.testimonials),
      title: { ar: "", en: "" },
      sortOrder: sortOrder,
      payload: { type: "TESTIMONIALS", items: parsed.testimonials },
    });
  }

  if (parsed.branches.length > 0) {
    sections.push({
      ...at(parsed.positions.branches),
      title: { ar: "", en: "" },
      sortOrder: sortOrder,
      payload: {
        type: "BRANCH_MAP",
        branches: parsed.branches.map((branch) => ({ name: { ar: branch.name, en: "" }, mapEmbedUrl: branch.mapEmbedUrl ?? "" })),
      },
    });
  }

  // SOCIAL_LINKS is synthesised from the store-config `social` object rather than the misleadingly
  // named `s-block--categories` "روابط سريعة" DOM section — see settings scraping below; the
  // caller inserts it before the FAQ, where the reference shows it.
  return sections
    .sort((a, b) => a.position - b.position)
    .map(({ position: _position, ...section }, index) => ({ ...section, sortOrder: index }));
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });

  log("fetching sitemaps");
  const [sitemapIndex] = [await get(`${BASE}/sitemap.xml`, "sitemap", "index.xml")];
  const sitemapUrls = parseSitemapLocs(sitemapIndex).filter((url) => /\/ar\//.test(url));
  const s1 = await get(sitemapUrls.find((url) => url.includes("sitemap-1"))!, "sitemap", "s1.xml");
  const s2 = await get(sitemapUrls.find((url) => url.includes("sitemap-2"))!, "sitemap", "s2.xml");
  const blogSitemap = sitemapUrls.find((url) => url.includes("blog-1"));
  const blog1 = blogSitemap ? await get(blogSitemap, "sitemap", "blog1.xml") : "";

  const productLocs = parseSitemapLocs(s2);
  const { pairs: productPairs } = groupSitemapUrlsById(productLocs, "product");
  const staticPagePairs = extractStaticPageUrls(parseSitemapLocs(s1));
  const { pairs: postPairsFromSitemap } = groupSitemapUrlsById(blog1 ? parseSitemapLocs(blog1) : [], "post");
  log(`sitemap: ${productPairs.length} products, ${staticPagePairs.length} static pages, ${postPairsFromSitemap.length} blog posts`);

  log("fetching home pages (categories + home sections + settings source)");
  const homeArHtml = await get(`${BASE}/ar`, "home", "ar.html");
  const homeEnHtml = await get(`${BASE}/en`, "home", "en.html");

  const { categories, nameIndex } = await scrapeCategories(homeArHtml, homeEnHtml);
  log(`categories: ${categories.length} (nav-derived; sitemap only lists a subset — see report)`);

  log("fetching brands");
  const { brands, nameToId: brandNameToId } = await scrapeBrands();
  log(`brands: ${brands.length}`);

  log(`fetching ${productPairs.length} products (this is the long step)`);
  const productResults = await scrapeProducts(productPairs, nameIndex, brandNameToId);
  log(`products: ${productResults.length} parsed`);

  upgradeBrandDescriptionsFromProducts(
    brands,
    brandNameToId,
    productResults.map((r) => ({ brandNameRaw: r.brandNameRaw, brandDescriptionHtml: r.brandDescriptionHtml }))
  );

  log("fetching static pages");
  const pages = await scrapePages(staticPagePairs);

  log("fetching blog posts");
  const postIds = postPairsFromSitemap.map((pair) => pair.id);
  const posts = await scrapePosts(postIds);

  log("parsing home sections + settings");
  const configFacts = extractStoreConfigFacts(homeArHtml);
  if (!configFacts) warnings.push("Could not extract the embedded store-config JSON from the home page.");

  const announcementAr = extractAnnouncement(homeArHtml);
  const announcementEn = extractAnnouncement(homeEnHtml);

  const homeArSections = buildHomeSections(homeArHtml, brands.map((b) => b.sallaId));
  const homeEnSections = buildHomeSections(homeEnHtml, brands.map((b) => b.sallaId));
  for (const sections of [homeArSections, homeEnSections]) {
    const faqIndex = sections.findIndex((section) => section.payload.type === "FAQ");
    const social: ScrapedHomeSection = {
      title: { ar: "", en: "" },
      sortOrder: 0,
      payload: { type: "SOCIAL_LINKS", items: [] },
    };
    sections.splice(faqIndex >= 0 ? faqIndex : sections.length, 0, social);
    sections.forEach((section, index) => (section.sortOrder = index));
  }

  const settings: ScrapedSettings = {
    storeName: { ar: configFacts?.storeName ?? "", en: configFacts?.storeName ?? "" },
    logo: configFacts?.logoUrl ? { sourceUrl: configFacts.logoUrl } : null,
    favicon: configFacts?.faviconUrl ? { sourceUrl: configFacts.faviconUrl } : null,
    contact: { phone: configFacts?.phone ?? "", whatsapp: configFacts?.whatsapp ?? "", email: configFacts?.email ?? "" },
    social: configFacts?.social ?? {},
    legal: {
      vatNumber: configFacts?.vatNumber ?? "",
      crNumber: configFacts?.crNumber ?? "",
      vatCertificate: configFacts?.vatCertificateUrl ? { sourceUrl: configFacts.vatCertificateUrl } : null,
    },
    // Rewritten to Riyadh-only per the workspace's explicit ZTES decision — the reference's own
    // text ("توصيل في نفس اليوم لجدة والرياض والدمام...") names three cities and is never used verbatim.
    announcements: [
      { ar: "توصيل في نفس اليوم داخل الرياض | الشحن مجاني للطلبات فوق 199 ريال", en: "Same-day delivery in Riyadh | Free shipping on orders over 199 SAR" },
    ],
    footerDescription: { ar: configFacts?.metaDescription ?? "", en: "" },
    branches: [], // populated from home sections at seed time (BRANCH_MAP payload is the source of truth)
    popup: null, // the scraped popup is stale seasonal (Saudi National Day) content — see report; not seeded as active
  };
  if (announcementAr) warnings.push(`Reference announcement text (not used verbatim, multi-city): "${announcementAr}" / EN: "${announcementEn}"`);

  const popupRaw = extractPopupRawHtml(homeArHtml);
  if (popupRaw) warnings.push(`Reference promo popup found (seasonal, not imported as active): ${popupRaw.length} chars of raw HTML — see data/reference/report.json for a title guess.`);
  const popupTitleMatch = popupRaw ? /<span class="bd">([^<]*)<\/span>/.exec(popupRaw) : null;
  if (popupTitleMatch) warnings.push(`Popup title guess: "${popupTitleMatch[1]}"`);

  const coupons: ScrapedCoupon[] = [];
  const couponCodesSeen = new Set(productResults.map((r) => r.couponCode).filter((code): code is string => Boolean(code)));
  const productsWithCoupon = productResults.filter((r) => r.couponCode).length;
  if (couponCodesSeen.size > 0) {
    warnings.push(`Coupon code(s) ${[...couponCodesSeen].join(", ")} appeared on ${productsWithCoupon}/${productResults.length} product pages — treated as store-wide.`);
  }
  for (const code of couponCodesSeen) {
    coupons.push({ code, description: { ar: "خصم إضافي 10%", en: "Extra 10% off" }, type: "PERCENT", value: "10" });
  }

  const promotions: QuantityTierFinding = {
    evidence:
      "Salla's 'tiered-offer' feature flag is enabled in the store config (settings.features on the cart/checkout bundle), " +
      "and the cart page's client bundle references a tiered-offer app, but no per-product tier configuration (minQuantity/percent) " +
      "was found embedded in any scraped product or cart page HTML with an empty cart — Salla renders that UI client-side from a " +
      "private API call made only once a real item is in the cart, which this SSR-only scraper cannot reach. The task's cited " +
      "'2 pieces -> 10%, 3 pieces -> 15%' was not independently reproduced from static HTML.",
    storeWide: "unknown",
    tiers: [],
  };

  const snapshot: ReferenceSnapshot = {
    scrapedAt: new Date().toISOString(),
    categories,
    brands,
    products: productResults.map((r) => r.product),
    pages,
    posts,
    home: { ar: homeArSections, en: homeEnSections },
    faqs: parseHomePage(homeArHtml).faqs.map((f) => ({ question: { ar: f.question, en: "" }, answer: { ar: f.answer, en: "" } })),
    testimonials: parseHomePage(homeArHtml).testimonials,
    coupons,
    promotions,
    settings,
  };

  const report: ScrapeReport = {
    scrapedAt: snapshot.scrapedAt,
    counts: {
      categories: categories.length,
      brands: brands.length,
      products: snapshot.products.length,
      reviews: snapshot.products.reduce((sum, p) => sum + p.reviews.length, 0),
      pages: pages.length,
      posts: posts.length,
      homeSectionsAr: homeArSections.length,
      homeSectionsEn: homeEnSections.length,
      coupons: coupons.length,
    },
    warnings,
    unmatchedCategoryNames: [...unmatchedCategoryNames],
  };

  await writeFile(path.join(OUT_DIR, "categories.json"), JSON.stringify(categories, null, 2));
  await writeFile(path.join(OUT_DIR, "brands.json"), JSON.stringify(brands, null, 2));
  await writeFile(path.join(OUT_DIR, "products.json"), JSON.stringify(snapshot.products, null, 2));
  await writeFile(path.join(OUT_DIR, "reviews.json"), JSON.stringify(snapshot.products.flatMap((p) => p.reviews.map((r) => ({ ...r, productSallaId: p.sallaId }))), null, 2));
  await writeFile(path.join(OUT_DIR, "pages.json"), JSON.stringify(pages, null, 2));
  await writeFile(path.join(OUT_DIR, "posts.json"), JSON.stringify(posts, null, 2));
  await writeFile(path.join(OUT_DIR, "home.json"), JSON.stringify(snapshot.home, null, 2));
  await writeFile(path.join(OUT_DIR, "faqs.json"), JSON.stringify(snapshot.faqs, null, 2));
  await writeFile(path.join(OUT_DIR, "testimonials.json"), JSON.stringify(snapshot.testimonials, null, 2));
  await writeFile(path.join(OUT_DIR, "coupons.json"), JSON.stringify(coupons, null, 2));
  await writeFile(path.join(OUT_DIR, "promotions.json"), JSON.stringify(promotions, null, 2));
  await writeFile(path.join(OUT_DIR, "settings.json"), JSON.stringify(settings, null, 2));
  await writeFile(path.join(OUT_DIR, "snapshot.json"), JSON.stringify(snapshot, null, 2));
  await writeFile(path.join(OUT_DIR, "report.json"), JSON.stringify(report, null, 2));

  log(`done. ${JSON.stringify(report.counts)}`);
  log(`${warnings.length} warnings, ${unmatchedCategoryNames.size} unmatched category names — see data/reference/report.json`);
}

main().catch((error) => {
  console.error("[reference:scrape] fatal:", error);
  process.exitCode = 1;
});
