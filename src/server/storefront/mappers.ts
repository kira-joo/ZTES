import type { ImageAsset } from "@kira-joo/toolkit-common";
import type { ProductSchema } from "src/server/catalog/product.schema";
import { readMoney, readOptionalMoney } from "src/server/core/money";
import type { ProductCardView } from "src/common/types/storefront";

const EMPTY = { ar: "", en: "" };

export const emptyLocalized = () => ({ ...EMPTY });

type BrandLike = { name?: { ar: string; en: string }; slug?: { ar: string; en: string } } | null | undefined;

export function toProductCard(product: ProductSchema, brand?: BrandLike): ProductCardView {
  const compareAt = readOptionalMoney(product.compareAtPrice);
  const price = readMoney(product.price);
  return {
    _id: String(product._id),
    name: product.name ?? EMPTY,
    slug: product.slug,
    brand: brand?.name && brand.slug ? { name: brand.name, slug: brand.slug } : null,
    image: (product.images?.[0] as ImageAsset | undefined) ?? null,
    hoverImage: (product.images?.[1] as ImageAsset | undefined) ?? null,
    price: price.toFixed(2),
    compareAtPrice: compareAt && compareAt.greaterThan(price) ? compareAt.toFixed(2) : null,
    saleEndsAt: product.saleEndsAt && product.saleEndsAt.getTime() > Date.now() ? product.saleEndsAt.toISOString() : null,
    badge: product.badge ?? null,
    ratingAverage: product.ratingAverage ?? 0,
    ratingCount: product.ratingCount ?? 0,
    inStock: !product.trackStock || product.stock > 0,
    hasRequiredOptions: (product.options ?? []).some((group) => group.required && group.values.length > 0),
  };
}

/** Fields a product card needs; keeps list queries light. */
export const CARD_FIELDS =
  "name slug brand images price compareAtPrice saleEndsAt badge ratingAverage ratingCount trackStock stock options.required options.values._id";
