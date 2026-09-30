import { BadRequestError, ConflictError } from "@kira-joo/backend-toolkit-core";
import { compare, toMoney } from "@kira-joo/toolkit-common";
import mongoose from "mongoose";
import { sanitizeLocalizedRichText } from "src/server/core/html/sanitize-html";
import { combineRating } from "src/server/engines/rating";
import { BrandModel } from "./brand.schema";
import { CategoryModel } from "./category.schema";
import type { BrandDto, CategoryDto, ProductDto } from "./dto/catalog.dto";
import { buildProductSearchText } from "./product-search-text";
import { ProductModel } from "./product.schema";
import { ReviewModel } from "./review.schema";

const MAX_CATEGORY_DEPTH = 3;
const oid = (id: string) => new mongoose.Types.ObjectId(id);

// ─── Categories ─────────────────────────────────────────────────────────────

/** Rejects a parent that would create a cycle or a fourth level. */
export async function assertValidCategoryParent(categoryId: string | null, parentId: string | null | undefined) {
  if (!parentId) return;
  if (categoryId && parentId === categoryId) throw new BadRequestError("A category cannot be its own parent.");

  let depth = 1;
  let cursor: string | null = parentId;
  while (cursor) {
    if (categoryId && cursor === categoryId) throw new BadRequestError("That parent is inside this category.");
    const parent: { parent?: mongoose.Types.ObjectId | null } | null = await CategoryModel.findById(cursor)
      .select("parent")
      .lean();
    if (!parent) throw new BadRequestError("The parent category does not exist.");
    depth += 1;
    cursor = parent.parent ? String(parent.parent) : null;
  }

  const childDepth = categoryId ? await subtreeHeight(categoryId) : 0;
  if (depth + childDepth > MAX_CATEGORY_DEPTH) {
    throw new BadRequestError(`Categories nest at most ${MAX_CATEGORY_DEPTH} levels deep.`);
  }
}

async function subtreeHeight(categoryId: string): Promise<number> {
  const children = await CategoryModel.find({ parent: oid(categoryId) }).select("_id").lean();
  if (children.length === 0) return 0;
  const heights = await Promise.all(children.map((child) => subtreeHeight(String(child._id))));
  return 1 + Math.max(...heights);
}

export function categoryPayload(dto: CategoryDto) {
  return {
    ...dto,
    parent: dto.parent ? oid(dto.parent) : null,
    ...(dto.description ? { description: sanitizeLocalizedRichText(dto.description) } : {}),
  };
}

export async function assertCategoryDeletable(categoryId: string) {
  const [children, products] = await Promise.all([
    CategoryModel.countDocuments({ parent: oid(categoryId) }),
    ProductModel.countDocuments({ categories: oid(categoryId), deletedAt: null }),
  ]);
  if (children > 0 || products > 0) {
    throw new ConflictError("Move or delete its sub-categories and products first.", { children, products });
  }
}

// ─── Brands ─────────────────────────────────────────────────────────────────

export function brandPayload(dto: BrandDto) {
  return { ...dto, ...(dto.description ? { description: sanitizeLocalizedRichText(dto.description) } : {}) };
}

export async function assertBrandDeletable(brandId: string) {
  const products = await ProductModel.countDocuments({ brand: oid(brandId), deletedAt: null });
  if (products > 0) throw new ConflictError("Reassign this brand's products first.", { products });
}

// ─── Products ───────────────────────────────────────────────────────────────

/** Normalises an admin product payload into what the schema stores. */
export async function productPayload(dto: ProductDto) {
  const price = toMoney(dto.price);
  const compareAtPrice = dto.compareAtPrice ? toMoney(dto.compareAtPrice) : null;
  if (compareAtPrice && compare(compareAtPrice, price) <= 0) {
    throw new BadRequestError("The compare-at price must be higher than the price.", { field: "compareAtPrice" });
  }

  const categories = [...new Set(dto.categories)];
  const primaryCategory = dto.primaryCategory && categories.includes(dto.primaryCategory) ? dto.primaryCategory : categories[0] ?? null;

  const brand = dto.brand ? await BrandModel.findById(dto.brand).select("name").lean() : null;
  if (dto.brand && !brand) throw new BadRequestError("That brand does not exist.", { field: "brand" });
  if (categories.length > 0 && (await CategoryModel.countDocuments({ _id: { $in: categories.map(oid) } })) !== categories.length) {
    throw new BadRequestError("One of the categories does not exist.", { field: "categories" });
  }

  return {
    ...dto,
    sku: dto.sku?.trim() || undefined,
    brand: dto.brand ? oid(dto.brand) : null,
    categories: categories.map(oid),
    primaryCategory: primaryCategory ? oid(primaryCategory) : null,
    price,
    compareAtPrice,
    saleEndsAt: dto.saleEndsAt ? new Date(dto.saleEndsAt) : null,
    ...(dto.description ? { description: sanitizeLocalizedRichText(dto.description) } : {}),
    options: (dto.options ?? []).map((group) => ({
      ...group,
      values: group.values.map((value) => ({ ...value, priceDelta: toMoney(value.priceDelta ?? "0") })),
    })),
    quantityTiers: [...(dto.quantityTiers ?? [])].sort((a, b) => a.minQuantity - b.minQuantity),
    searchText: buildProductSearchText({ name: dto.name, sku: dto.sku, brandName: brand?.name ?? null }),
  };
}

// ─── Reviews ────────────────────────────────────────────────────────────────

/**
 * Recomputes a product's displayed rating from its baseline plus the published
 * reviews written in ZTES (imported reviews are already inside the baseline).
 */
export async function recomputeProductRating(productId: mongoose.Types.ObjectId | string, session?: mongoose.ClientSession) {
  const product = await ProductModel.findById(productId).session(session ?? null).select("ratingBaseline").lean();
  if (!product) return;
  const reviews = await ReviewModel.find({
    product: productId,
    isPublished: true,
    $or: [{ "legacy.sallaId": { $exists: false } }, { "legacy.sallaId": null }],
  })
    .session(session ?? null)
    .select("rating")
    .lean();
  const combined = combineRating(product.ratingBaseline ?? { average: 0, count: 0 }, reviews.map((review) => review.rating));
  await ProductModel.updateOne(
    { _id: productId },
    { $set: { ratingAverage: combined.average, ratingCount: combined.count } },
    { session }
  );
}
