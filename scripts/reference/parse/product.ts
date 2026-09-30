import { decodeHtmlEntities, extractBalancedTag, extractJsonLdGraphNodes, extractMetaTags, deepUnsliceStrings } from "../lib/html-utils";

export interface ProductJsonLd {
  name: string;
  description: string;
  offers: { availability: string; price: number };
  brand?: { name: string; description?: string };
  aggregateRating?: { ratingValue: number; ratingCount: number };
  review?: { author?: { name?: string }; datePublished?: string; reviewBody?: string; reviewRating?: { ratingValue: number } }[];
  image?: string;
}

export interface SliderImage {
  id: number;
  url: string;
  main: boolean;
  type: "image" | "video";
  sort: number;
  alt?: string;
}

export interface ProductOptionValueRaw {
  id: number;
  name: string;
  additional_price: number;
  image: string;
  is_out: boolean;
}

export interface ProductOptionGroupRaw {
  id: number;
  name: string;
  type: "thumbnail" | "text";
  required: boolean;
  details: ProductOptionValueRaw[];
}

export interface ParsedProductPage {
  sallaId: string | null;
  name: string;
  descriptionHtml: string;
  brandName: string | null;
  brandDescriptionHtml: string | null;
  aggregateRating: { average: number; count: number };
  reviews: { authorName: string; rating: number; body: string; date: string }[];
  /** meta `product:sale_price:amount` if present, else `product:price:amount`. */
  price: string | null;
  /** meta `product:price:amount` only when a distinct sale price makes it a genuine "before" price. */
  compareAtPrice: string | null;
  availability: "in_stock" | "out_of_stock";
  categoryNames: string[];
  images: SliderImage[];
  options: ProductOptionGroupRaw[];
  /** The "رقم الموديل"/"Model" details row — NOT the bogus ld+json `sku` (a reused URL slug, see report). */
  modelNumber: string | null;
  weightText: string | null;
  /** `null` when the "عدد مرات الشراء"/purchase-count widget isn't present (`total_sold_enabled` off, or zero). */
  soldCount: number | null;
  couponCode: string | null;
}

function extractQuotedAttributeJson<T>(html: string, attrName: string): T | null {
  const re = new RegExp(`${attrName}=(['"])(\\[[\\s\\S]*?\\])\\1`);
  const match = re.exec(html);
  if (!match) return null;
  try {
    return JSON.parse(decodeHtmlEntities(match[2]!)) as T;
  } catch {
    return null;
  }
}

/** Extracts and parses the single Product node out of a page's ld+json `@graph`. */
export function extractProductJsonLd(html: string): ProductJsonLd | null {
  const node = extractJsonLdGraphNodes(html).find((n) => n["@type"] === "Product");
  return (node as unknown as ProductJsonLd) ?? null;
}

function _parseProductPage(html: string): ParsedProductPage {
  const meta = extractMetaTags(html);
  const jsonLd = extractProductJsonLd(html);

  const salePrice = meta["product:sale_price:amount"];
  const regularPrice = meta["product:price:amount"];
  const price = salePrice ?? regularPrice ?? null;
  const compareAtPrice = salePrice && regularPrice && salePrice !== regularPrice ? regularPrice : null;

  const categoryNames = (meta["product:category"] ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  const images = (extractQuotedAttributeJson<SliderImage[]>(html, "data-images") ?? [])
    .filter((image) => image.type === "image")
    .sort((a, b) => (a.main === b.main ? a.sort - b.sort : a.main ? -1 : 1));

  const optionGroups = extractQuotedAttributeJson<{ id: number; name: string; type: string; required: boolean; details: unknown[] }[]>(
    html,
    "options"
  );
  const options: ProductOptionGroupRaw[] = (optionGroups ?? []).map((group) => ({
    id: group.id,
    name: group.name,
    type: group.type === "thumbnail" ? "thumbnail" : "text",
    required: group.required,
    details: (group.details as ProductOptionValueRaw[]) ?? [],
  }));

  // The ld+json `description` is truncated by Salla with a literal "..." —
  // the full rich-HTML description lives in `<article id="more-content">`
  // (a details/specs dump), confirmed against the "جل ادفيون" fixture.
  const moreContentMarker = /<article[^>]*id="more-content"[^>]*>/.exec(html);
  const fullDescriptionHtml = moreContentMarker
    ? (extractBalancedTag(html, moreContentMarker.index + moreContentMarker[0].length, "article") ?? "").trim()
    : "";

  const soldCountMatch = /class="sold-count">(\d+)</.exec(html);
  const weightMatch = /class="product-weight[^"]*">\s*([^<]*?)\s*</.exec(html);
  const modelMatch = /class="sku details">[\s\S]*?class="text-sm">([^<]*)</.exec(html);
  const idMatch = /product-id="(\d+)"|"retailer_item_id":"(\d+)"|name="id" value="(\d+)"/.exec(html);
  const couponMatch = /id="coupon-value"[^>]*value="([^"]+)"/.exec(html);

  const rawReviews = jsonLd?.review;
  const reviews = (Array.isArray(rawReviews) ? rawReviews : rawReviews ? [rawReviews] : []).map((review) => ({
    authorName: (review.author?.name ?? "").trim(),
    rating: review.reviewRating?.ratingValue ?? 5,
    body: (review.reviewBody ?? "").trim(),
    date: review.datePublished ?? "",
  }));

  return {
    sallaId: meta["product:retailer_item_id"] ?? idMatch?.[1] ?? idMatch?.[2] ?? idMatch?.[3] ?? null,
    name: jsonLd?.name ?? "",
    descriptionHtml: fullDescriptionHtml || jsonLd?.description || "",
    brandName: jsonLd?.brand?.name ?? meta["product:brand"] ?? null,
    brandDescriptionHtml: jsonLd?.brand?.description ?? null,
    aggregateRating: {
      average: jsonLd?.aggregateRating?.ratingValue ?? 0,
      count: jsonLd?.aggregateRating?.ratingCount ?? 0,
    },
    reviews,
    price,
    compareAtPrice,
    availability: meta["product:availability"] === "in stock" ? "in_stock" : "out_of_stock",
    categoryNames,
    images,
    options,
    modelNumber: modelMatch?.[1]?.trim() || null,
    weightText: weightMatch?.[1]?.trim() || null,
    soldCount: soldCountMatch ? Number(soldCountMatch[1]) : null,
    couponCode: couponMatch?.[1] ?? null,
  };
}

export function parseProductPage(html: string): ParsedProductPage {
  return deepUnsliceStrings(_parseProductPage(html));
}
