import { decodeHtmlEntities, extractIdFromPath, stripTags, deepUnsliceStrings } from "../lib/html-utils";

export interface HomeMediaItemRaw {
  imageUrl: string | null;
  title: string;
  subtitle: string;
  href: string;
}

export interface ProductRailRaw {
  sortIndex: number;
  /** Character offset in the page (DOM order). */
  position: number;
  title: string;
  source: "categories" | "selected";
  ids: string[];
  limit: number;
}

export interface SpotlightRaw {
  sortIndex: number;
  /** Character offset in the page (DOM order). */
  position: number;
  productSallaId: string | null;
  videoUrl: string | null;
  endsAt: string | null;
  couponCode: string | null;
}

export interface BannerGroupRaw {
  sortIndex: number;
  /** Character offset in the page (DOM order). */
  position: number;
  title: string;
  items: HomeMediaItemRaw[];
}

export interface FaqItemRaw {
  question: string;
  answer: string;
}

export interface TestimonialRaw {
  authorName: string;
  body: string;
  rating: number;
}

export interface TrustItemRaw {
  title: string;
  subtitle: string;
  iconUrl: string | null;
}

export interface BranchRaw {
  name: string;
  mapEmbedUrl: string | null;
}

/** Character offsets of each single-instance block in the page, for DOM ordering (-1 = absent). */
export interface HomeBlockPositions {
  hero: number;
  brands: number;
  trust: number;
  faqs: number;
  blog: number;
  testimonials: number;
  branches: number;
}

export interface ParsedHomePage {
  positions: HomeBlockPositions;
  heroSlides: HomeMediaItemRaw[];
  brandCarouselHrefs: string[];
  spotlights: SpotlightRaw[];
  productRails: ProductRailRaw[];
  bannerGroups: BannerGroupRaw[];
  trustItems: TrustItemRaw[];
  faqs: FaqItemRaw[];
  blogPostIds: string[];
  testimonials: TestimonialRaw[];
  branches: BranchRaw[];
}

function sectionBody(html: string, componentId: string): string | null {
  const re = new RegExp(`component-id="${componentId}"[^>]*>([\\s\\S]*?)</section>`);
  return re.exec(html)?.[1] ?? null;
}

function allSectionIds(html: string, blockClass: string): string[] {
  const re = new RegExp(`<section component-id="([0-9]*)" class="[^"]*${blockClass}[^"]*"`, "g");
  const ids: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) if (match[1]) ids.push(match[1]);
  return ids;
}

function parseMediaItems(sectionHtml: string): HomeMediaItemRaw[] {
  const items: HomeMediaItemRaw[] = [];
  const re =
    /<a href="([^"]*)"[^>]*>\s*(?:<div class="box-img[^"]*">)?\s*<img[^>]*(?:data-src|src)="([^"]*)"[^>]*>(?:\s*<\/div>)?/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(sectionHtml))) {
    items.push({ href: match[1]!, imageUrl: match[2] || null, title: "", subtitle: "" });
  }
  // Titles/subtitles for the "text-wrapper" banner-square variant, matched positionally.
  const titleRe = /<p class="w-full text-xs[^"]*font-primary">([^<]*)<\/p>\s*(?:<p class="w-full text-xxs[^"]*">([^<]*)<\/p>)?/g;
  let titleMatch: RegExpExecArray | null;
  let i = 0;
  while ((titleMatch = titleRe.exec(sectionHtml)) && i < items.length) {
    items[i]!.title = decodeHtmlEntities(titleMatch[1] ?? "").trim();
    items[i]!.subtitle = decodeHtmlEntities(titleMatch[2] ?? "").trim();
    i++;
  }
  return items;
}

function _parseHomePage(html: string): ParsedHomePage {
  const positionOf = (id: string | undefined) => (id ? html.indexOf(`component-id="${id}"`) : -1);

  // --- HERO_SLIDER ---
  const heroSection = sectionBody(html, allSectionIds(html, "s-block--photos-slider")[0] ?? "__none__");
  const heroSlides = heroSection ? parseMediaItems(heroSection) : [];

  // --- BRAND_CAROUSEL ---
  const logosSectionId = allSectionIds(html, "s-block--logos-slider")[0];
  const logosSection = logosSectionId ? sectionBody(html, logosSectionId) : null;
  const brandCarouselHrefs: string[] = [];
  if (logosSection) {
    const re = /<a href="([^"]*brand-\d+[^"]*)"/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(logosSection))) brandCarouselHrefs.push(match[1]!);
  }

  // --- SPOTLIGHT (one or more `s-block--special-product` sections) ---
  const spotlights: SpotlightRaw[] = allSectionIds(html, "s-block--special-product").map((id, index) => {
    const body = sectionBody(html, id) ?? "";
    const productMatch = /product-id="(\d+)"/.exec(body);
    const videoMatch = /<source src="([^"]+)"/.exec(body);
    const endsMatch = /<salla-count-down date="([^"]+)"/.exec(body);
    const couponMatch = /id="coupon-value"[^>]*value="([^"]+)"/.exec(body);
    return {
      sortIndex: index,
      position: positionOf(id),
      productSallaId: productMatch?.[1] ?? null,
      videoUrl: videoMatch?.[1] ?? null,
      endsAt: endsMatch?.[1] ?? null,
      couponCode: couponMatch?.[1] ?? null,
    };
  });

  // --- PRODUCT_RAIL (`<salla-products-slider>`, excluding the client-only "recently viewed" one) ---
  const productRails: ProductRailRaw[] = [];
  const railRe = /<salla-products-slider\b([\s\S]*?)>/g;
  let railMatch: RegExpExecArray | null;
  let railIndex = 0;
  while ((railMatch = railRe.exec(html))) {
    const attrs = railMatch[1]!;
    if (/id="viewed-products-list"/.test(attrs)) continue;
    const sourceMatch = /source="(categories|selected)"/.exec(attrs);
    const valuesMatch = /source-value="(\[[^\]]*\])"/.exec(attrs);
    const limitMatch = /limit="(\d+)"/.exec(attrs);
    const titleMatch = /block-title="([^"]*)"/.exec(attrs);
    if (!sourceMatch || !valuesMatch) continue;
    let ids: string[] = [];
    try {
      ids = (JSON.parse(valuesMatch[1]!) as number[]).map(String);
    } catch {
      ids = [];
    }
    productRails.push({
      sortIndex: railIndex++,
      position: railMatch.index,
      title: decodeHtmlEntities(titleMatch?.[1] ?? ""),
      source: sourceMatch[1] as "categories" | "selected",
      ids,
      limit: limitMatch ? Number(limitMatch[1]) : 16,
    });
  }

  // --- BANNER / TILE_ROW (`s-block--banners` + `s-block--fixed-banner`) ---
  const bannerGroups: BannerGroupRaw[] = [
    ...allSectionIds(html, "s-block--banners"),
    ...allSectionIds(html, "s-block--fixed-banner"),
  ].map((id, index) => {
    const body = sectionBody(html, id) ?? "";
    const titleMatch = /<h2 class="w-full da-cp[^"]*">([^<]*)<\/h2>/.exec(body);
    return {
      sortIndex: index,
      position: positionOf(id),
      title: decodeHtmlEntities(titleMatch?.[1] ?? "").trim(),
      items: parseMediaItems(body),
    };
  });

  // --- TRUST_STRIP (`s-block--features`) ---
  const featuresId = allSectionIds(html, "s-block--features")[0];
  const featuresBody = featuresId ? (sectionBody(html, featuresId) ?? "") : "";
  const trustItems: TrustItemRaw[] = [];
  {
    const re =
      /angel-feature[^"]*"[^>]*>[\s\S]*?data-bg="([^"]*)"[\s\S]*?<p class="[^"]*text-center text-base[^"]*"[^>]*>([^<]*)<\/p>\s*<p class="[^"]*text-center text-sm[^"]*"[^>]*>([^<]*)<\/p>/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(featuresBody))) {
      trustItems.push({ iconUrl: match[1] || null, title: decodeHtmlEntities(match[2]!).trim(), subtitle: decodeHtmlEntities(match[3]!).trim() });
    }
  }

  // --- FAQ (`s-block--faqs`) ---
  const faqs: FaqItemRaw[] = [];
  {
    const faqsId = allSectionIds(html, "s-block--faqs")[0];
    const faqsBody = faqsId ? (sectionBody(html, faqsId) ?? "") : "";
    const re = /<label class="[^"]*" for="faq-\d+">([\s\S]*?)<i class="faq-item[\s\S]*?<p class="da-tm mb-2">([\s\S]*?)<\/p>/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(faqsBody))) {
      faqs.push({ question: stripTags(match[1]!), answer: stripTags(match[2]!) });
    }
  }

  // --- BLOG_RAIL (`s-blog--slider`) --- each card links its image and its
  // "read more" both to `/a-<id>`, so raw matches double-count; dedupe.
  const blogPostIds: string[] = [];
  {
    const blogId = allSectionIds(html, "s-blog--slider")[0];
    const blogBody = blogId ? (sectionBody(html, blogId) ?? "") : "";
    const re = /\/a-(\d+)/g;
    const seen = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = re.exec(blogBody))) {
      if (!seen.has(match[1]!)) {
        seen.add(match[1]!);
        blogPostIds.push(match[1]!);
      }
    }
  }

  // --- TESTIMONIALS (`s-block--testimonials`) ---
  const testimonials: TestimonialRaw[] = [];
  {
    const testimonialsId = allSectionIds(html, "s-block--testimonials")[0];
    const body = testimonialsId ? (sectionBody(html, testimonialsId) ?? "") : "";
    const re =
      /alt="([^"]*)"[^>]*>[\s\S]*?<salla-rating-stars[^>]*value="(\d+)"[\s\S]*?<p class="text-base[^"]*">([\s\S]*?)<\/p>/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(body))) {
      testimonials.push({ authorName: decodeHtmlEntities(match[1]!).trim(), rating: Number(match[2]), body: stripTags(match[3]!) });
    }
  }

  // --- BRANCH_MAP (`s-angel-maps.ar-only` — this is the AR page; parse it regardless of locale) ---
  const branches: BranchRaw[] = [];
  {
    const mapsMatch = /<section component-id="\d*" class="s-block s-angel-maps[^"]*"[^>]*>([\s\S]*?)<\/section>/.exec(html);
    const body = mapsMatch?.[1] ?? "";
    const nameRe = /data-target="maps-tab-\d+"[^>]*>\s*<i[^>]*><\/i>\s*<span>([^<]*)<\/span>/g;
    const names: string[] = [];
    let nameMatch: RegExpExecArray | null;
    while ((nameMatch = nameRe.exec(body))) names.push(decodeHtmlEntities(nameMatch[1]!).trim());

    const tabRe = /id="maps-tab-(\d+)" class="tabs__item[^"]*">([\s\S]*?)(?=id="maps-tab-\d+" class="tabs__item|$)/g;
    let tabMatch: RegExpExecArray | null;
    while ((tabMatch = tabRe.exec(body))) {
      const index = Number(tabMatch[1]) - 1;
      const iframeMatch = /<iframe src="([^"]+)"/.exec(tabMatch[2]!);
      branches.push({ name: names[index] ?? `Branch ${tabMatch[1]}`, mapEmbedUrl: iframeMatch?.[1] ?? null });
    }
  }

  const mapsIndex = html.search(/<section component-id="\d*" class="s-block s-angel-maps/);
  const positions: HomeBlockPositions = {
    hero: positionOf(allSectionIds(html, "s-block--photos-slider")[0]),
    brands: positionOf(logosSectionId),
    trust: positionOf(featuresId),
    faqs: positionOf(allSectionIds(html, "s-block--faqs")[0]),
    blog: positionOf(allSectionIds(html, "s-blog--slider")[0]),
    testimonials: positionOf(allSectionIds(html, "s-block--testimonials")[0]),
    branches: mapsIndex,
  };

  return {
    positions,
    heroSlides,
    brandCarouselHrefs,
    spotlights,
    productRails,
    bannerGroups,
    trustItems,
    faqs,
    blogPostIds,
    testimonials,
    branches,
  };
}

export function extractPostIdFromHref(href: string): string | null {
  return extractIdFromPath(href, /\/a-(\d+)/);
}

export function parseHomePage(html: string): ParsedHomePage {
  return deepUnsliceStrings(_parseHomePage(html));
}
