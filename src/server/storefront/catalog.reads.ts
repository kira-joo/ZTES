import "server-only";
import mongoose from "mongoose";
import { ProductSort } from "src/common/enums";
import type {
  BrandView,
  CategoryNode,
  CategoryView,
  FacetOption,
  ProductCardView,
  ProductDetailView,
  ProductListParams,
  ProductListView,
  ReviewView,
} from "src/common/types/storefront";
import { BrandModel, type BrandSchema } from "src/server/catalog/brand.schema";
import { CategoryModel, type CategorySchema } from "src/server/catalog/category.schema";
import { ProductModel, type ProductSchema } from "src/server/catalog/product.schema";
import { ReviewModel } from "src/server/catalog/review.schema";
import { readMoney } from "src/server/core/money";
import { CacheTag } from "src/server/core/revalidation/cache-tag";
import { normalizeSearchText } from "src/server/engines/normalize";
import { cachedRead } from "./cached-read";
import { CARD_FIELDS, emptyLocalized, toProductCard } from "./mappers";

const ACTIVE_PRODUCT = { isActive: true, deletedAt: null };
const oid = (id: string) => new mongoose.Types.ObjectId(id);
const isId = (id: string | undefined): id is string => Boolean(id && mongoose.isValidObjectId(id));

// ─── Categories ─────────────────────────────────────────────────────────────

async function activeCategories() {
  return CategoryModel.find({ isActive: true }).sort({ sortOrder: 1, _id: 1 }).lean<CategorySchema[]>();
}

export const getCategoryTree = cachedRead(
  "category-tree",
  [CacheTag.CATEGORIES],
  async (): Promise<CategoryNode[]> => {
    const all = await activeCategories();
    const nodes = new Map<string, CategoryNode>();
    for (const category of all) {
      nodes.set(String(category._id), {
        _id: String(category._id),
        name: category.name,
        slug: category.slug,
        icon: category.icon ?? null,
        image: category.image ?? null,
        showInMenu: category.showInMenu,
        children: [],
      });
    }
    const roots: CategoryNode[] = [];
    for (const category of all) {
      const node = nodes.get(String(category._id))!;
      const parent = category.parent ? nodes.get(String(category.parent)) : undefined;
      if (parent) parent.children.push(node);
      else if (!category.parent) roots.push(node);
    }
    return roots;
  }
);

/** Every descendant id, including the category itself: a parent lists its sub-categories' products. */
async function categoryWithDescendants(categoryId: string): Promise<mongoose.Types.ObjectId[]> {
  const all = await CategoryModel.find({ isActive: true }).select("parent").lean();
  const children = new Map<string, string[]>();
  for (const category of all) {
    const parent = category.parent ? String(category.parent) : "";
    children.set(parent, [...(children.get(parent) ?? []), String(category._id)]);
  }
  const result: string[] = [];
  const queue = [categoryId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);
    queue.push(...(children.get(current) ?? []));
  }
  return result.map(oid);
}

async function breadcrumbFor(categoryId: string | null) {
  const trail: CategoryView["breadcrumb"] = [];
  let cursor = categoryId;
  while (cursor) {
    const category: CategorySchema | null = await CategoryModel.findById(cursor).select("name slug parent").lean();
    if (!category) break;
    trail.unshift({ _id: String(category._id), name: category.name, slug: category.slug });
    cursor = category.parent ? String(category.parent) : null;
  }
  return trail;
}

export const getCategoryBySlug = cachedRead(
  "category-by-slug",
  [CacheTag.CATEGORIES],
  async (locale: "ar" | "en", slug: string): Promise<CategoryView | null> => {
    const category = await CategoryModel.findOne({ [`slug.${locale}`]: slug, isActive: true }).lean<CategorySchema>();
    if (!category) return null;
    const children = await CategoryModel.find({ parent: category._id, isActive: true })
      .sort({ sortOrder: 1 })
      .select("name slug")
      .lean();
    return {
      _id: String(category._id),
      name: category.name,
      slug: category.slug,
      description: category.description ?? emptyLocalized(),
      image: category.image ?? null,
      banner: category.banner ?? null,
      seo: category.seo ?? { title: emptyLocalized(), description: emptyLocalized() },
      breadcrumb: await breadcrumbFor(String(category._id)),
      children: children.map((child) => ({ _id: String(child._id), name: child.name, slug: child.slug })),
    };
  }
);

// ─── Brands ─────────────────────────────────────────────────────────────────

function toBrandView(brand: BrandSchema): BrandView {
  return {
    _id: String(brand._id),
    name: brand.name,
    slug: brand.slug,
    logo: brand.logo ?? null,
    description: brand.description ?? emptyLocalized(),
    seo: brand.seo ?? { title: emptyLocalized(), description: emptyLocalized() },
  };
}

export const getBrands = cachedRead(
  "brands",
  [CacheTag.BRANDS],
  async (): Promise<BrandView[]> =>
    (await BrandModel.find({ isActive: true }).sort({ sortOrder: 1, _id: 1 }).lean<BrandSchema[]>()).map(toBrandView)
);

export const getBrandBySlug = cachedRead(
  "brand-by-slug",
  [CacheTag.BRANDS],
  async (locale: "ar" | "en", slug: string): Promise<BrandView | null> => {
    const brand = await BrandModel.findOne({ [`slug.${locale}`]: slug, isActive: true }).lean<BrandSchema>();
    return brand ? toBrandView(brand) : null;
  }
);

// ─── Product lists ──────────────────────────────────────────────────────────

const SORTS: Record<ProductSort, Record<string, 1 | -1>> = {
  [ProductSort.SUGGESTED]: { isFeatured: -1, sortOrder: 1, createdAt: -1, _id: -1 },
  [ProductSort.BEST_SELLING]: { soldCount: -1, _id: -1 },
  [ProductSort.TOP_RATED]: { ratingAverage: -1, ratingCount: -1, _id: -1 },
  [ProductSort.PRICE_HIGH]: { price: -1, _id: -1 },
  [ProductSort.PRICE_LOW]: { price: 1, _id: -1 },
};

async function brandsById(ids: readonly unknown[]) {
  const unique = [...new Set(ids.filter(Boolean).map(String))];
  if (unique.length === 0) return new Map<string, BrandSchema>();
  const brands = await BrandModel.find({ _id: { $in: unique.map(oid) } }).select("name slug").lean<BrandSchema[]>();
  return new Map(brands.map((brand) => [String(brand._id), brand]));
}

export async function toCards(products: ProductSchema[]): Promise<ProductCardView[]> {
  const brands = await brandsById(products.map((product) => product.brand));
  return products.map((product) => toProductCard(product, product.brand ? brands.get(String(product.brand)) : null));
}

async function scopeFilter(params: ProductListParams) {
  const filter: Record<string, unknown> = { ...ACTIVE_PRODUCT };
  if (isId(params.category)) filter.categories = { $in: await categoryWithDescendants(params.category) };
  if (isId(params.brand)) filter.brand = oid(params.brand);
  if (params.onSale) filter.$expr = { $gt: ["$compareAtPrice", "$price"] };
  if (params.search?.trim()) {
    const terms = normalizeSearchText(params.search).split(" ").filter(Boolean).slice(0, 6);
    if (terms.length > 0) {
      filter.$and = terms.map((term) => ({ searchText: { $regex: term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") } }));
    }
  }
  return filter;
}

export const listProducts = cachedRead(
  "product-list",
  [CacheTag.PRODUCTS, CacheTag.CATEGORIES, CacheTag.BRANDS],
  async (params: ProductListParams): Promise<ProductListView> => {
    const limit = Math.min(Math.max(params.limit ?? 24, 1), 60);
    const page = Math.max(params.page ?? 1, 1);
    const scope = await scopeFilter(params);

    const selected: Record<string, unknown> = { ...scope };
    const brandIds = (params.brands ?? []).filter(isId);
    const categoryIds = (params.categories ?? []).filter(isId);
    if (brandIds.length > 0) selected.brand = { $in: brandIds.map(oid) };
    if (categoryIds.length > 0) {
      const expanded = (await Promise.all(categoryIds.map(categoryWithDescendants))).flat();
      selected.categories = { $in: expanded };
    }

    const [items, total] = await Promise.all([
      ProductModel.find(selected)
        .sort(SORTS[params.sort ?? ProductSort.SUGGESTED])
        .skip((page - 1) * limit)
        .limit(limit)
        .select(CARD_FIELDS)
        .lean<ProductSchema[]>(),
      ProductModel.countDocuments(selected),
    ]);

    return {
      items: await toCards(items),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      facets: await facetsFor(params, scope, brandIds),
    };
  }
);

/**
 * Filter counts like the reference's side panel: sub-categories of the current
 * category (or top-level ones) and brands, each counted within the current scope.
 */
async function facetsFor(params: ProductListParams, scope: Record<string, unknown>, brandIds: string[]) {
  const facetCategories = isId(params.category)
    ? await CategoryModel.find({ parent: oid(params.category), isActive: true }).sort({ sortOrder: 1 }).lean<CategorySchema[]>()
    : await CategoryModel.find({ parent: null, isActive: true }).sort({ sortOrder: 1 }).lean<CategorySchema[]>();

  const categoryCounts: FacetOption[] = [];
  for (const category of facetCategories) {
    const ids = await categoryWithDescendants(String(category._id));
    const count = await ProductModel.countDocuments({
      ...scope,
      ...(brandIds.length ? { brand: { $in: brandIds.map(oid) } } : {}),
      categories: { $in: ids },
    });
    if (count > 0) categoryCounts.push({ _id: String(category._id), name: category.name, slug: category.slug, count });
  }

  const brandCounts = await ProductModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
    { $match: { ...scope, brand: { $ne: null } } },
    { $group: { _id: "$brand", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  const brands = await brandsById(brandCounts.map((row) => row._id));
  return {
    categories: categoryCounts,
    brands: brandCounts
      .map((row) => {
        const brand = brands.get(String(row._id));
        return brand ? { _id: String(row._id), name: brand.name, slug: brand.slug, count: row.count } : null;
      })
      .filter((row): row is FacetOption => row !== null),
  };
}

// ─── Product detail ─────────────────────────────────────────────────────────

async function toDetail(product: ProductSchema): Promise<ProductDetailView> {
    const brand = product.brand ? await BrandModel.findById(product.brand).select("name slug").lean<BrandSchema>() : null;
    const breadcrumb = await breadcrumbFor(product.primaryCategory ? String(product.primaryCategory) : null);

    return {
      ...toProductCard(product, brand),
      description: product.description ?? emptyLocalized(),
      sku: product.sku ?? null,
      images: product.images ?? [],
      stock: product.stock,
      trackStock: product.trackStock,
      weight: product.weight ?? emptyLocalized(),
      options: (product.options ?? []).map((group) => ({
        _id: String(group._id),
        name: group.name,
        type: group.type,
        required: group.required,
        values: [...group.values]
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((value) => ({
            _id: String(value._id),
            label: value.label,
            priceDelta: readMoney(value.priceDelta).toFixed(2),
            image: value.image ?? null,
            isAvailable: value.isAvailable,
          })),
      })),
      quantityTiers: product.quantityTiers ?? [],
      soldCount: product.soldCount ?? 0,
      primaryCategory: breadcrumb.at(-1) ?? null,
      breadcrumb,
      brandId: product.brand ? String(product.brand) : null,
      seo: product.seo ?? { title: emptyLocalized(), description: emptyLocalized() },
    };
}

export const getProductBySlug = cachedRead(
  "product-by-slug",
  [CacheTag.PRODUCTS, CacheTag.REVIEWS],
  async (locale: "ar" | "en", slug: string): Promise<ProductDetailView | null> => {
    const product = await ProductModel.findOne({ ...ACTIVE_PRODUCT, [`slug.${locale}`]: slug }).lean<ProductSchema>();
    return product ? toDetail(product) : null;
  }
);

/** For the quick-view dialog. */
export const getProductById = cachedRead(
  "product-by-id",
  [CacheTag.PRODUCTS, CacheTag.REVIEWS],
  async (id: string): Promise<ProductDetailView | null> => {
    if (!isId(id)) return null;
    const product = await ProductModel.findOne({ ...ACTIVE_PRODUCT, _id: oid(id) }).lean<ProductSchema>();
    return product ? toDetail(product) : null;
  }
);

/** "You may also like": same primary category, then same brand, never the product itself. */
export const getRelatedProducts = cachedRead(
  "related-products",
  [CacheTag.PRODUCTS],
  async (productId: string, categoryId: string | null, brandId: string | null, limit: number = 12): Promise<ProductCardView[]> => {
    const exclude = { _id: { $ne: oid(productId) } };
    const byCategory = categoryId
      ? await ProductModel.find({ ...ACTIVE_PRODUCT, ...exclude, categories: oid(categoryId) })
          .sort({ soldCount: -1 })
          .limit(limit)
          .select(CARD_FIELDS)
          .lean<ProductSchema[]>()
      : [];
    const seen = new Set(byCategory.map((product) => String(product._id)));
    const byBrand =
      byCategory.length < limit && brandId
        ? (
            await ProductModel.find({ ...ACTIVE_PRODUCT, ...exclude, brand: oid(brandId) })
              .sort({ soldCount: -1 })
              .limit(limit)
              .select(CARD_FIELDS)
              .lean<ProductSchema[]>()
          ).filter((product) => !seen.has(String(product._id)))
        : [];
    return toCards([...byCategory, ...byBrand].slice(0, limit));
  }
);

/** "Customers also viewed": the best sellers sharing any of the product's categories. */
export const getAlsoViewed = cachedRead(
  "also-viewed",
  [CacheTag.PRODUCTS],
  async (productId: string, limit: number = 12): Promise<ProductCardView[]> => {
    const product = await ProductModel.findById(productId).select("categories").lean();
    if (!product) return [];
    const items = await ProductModel.find({
      ...ACTIVE_PRODUCT,
      _id: { $ne: product._id },
      categories: { $in: product.categories },
    })
      .sort({ ratingCount: -1, soldCount: -1 })
      .skip(limit)
      .limit(limit)
      .select(CARD_FIELDS)
      .lean<ProductSchema[]>();
    return toCards(items);
  }
);

export const getProductsByIds = cachedRead(
  "products-by-ids",
  [CacheTag.PRODUCTS],
  async (ids: string[]): Promise<ProductCardView[]> => {
    const valid = ids.filter(isId);
    if (valid.length === 0) return [];
    const products = await ProductModel.find({ ...ACTIVE_PRODUCT, _id: { $in: valid.map(oid) } })
      .select(CARD_FIELDS)
      .lean<ProductSchema[]>();
    const byId = new Map(products.map((product) => [String(product._id), product]));
    return toCards(valid.map((id) => byId.get(id)).filter((product): product is ProductSchema => Boolean(product)));
  }
);

export const getProductReviews = cachedRead(
  "product-reviews",
  [CacheTag.REVIEWS],
  async (productId: string, page: number = 1, limit: number = 10): Promise<{ items: ReviewView[]; total: number }> => {
    if (!isId(productId)) return { items: [], total: 0 };
    const filter = { product: oid(productId), isPublished: true };
    const [items, total] = await Promise.all([
      ReviewModel.find(filter).sort({ reviewedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      ReviewModel.countDocuments(filter),
    ]);
    return {
      items: items.map((review) => ({
        _id: String(review._id),
        authorName: review.authorName,
        rating: review.rating,
        body: review.body,
        reviewedAt: review.reviewedAt.toISOString(),
      })),
      total,
    };
  }
);

/** Every active product slug, for the sitemap. */
export const getProductSlugs = cachedRead(
  "product-slugs",
  [CacheTag.PRODUCTS],
  async () =>
    (await ProductModel.find(ACTIVE_PRODUCT).select("slug updatedAt").lean()).map((product) => ({
      slug: product.slug,
      updatedAt: (product as { updatedAt?: Date }).updatedAt?.toISOString() ?? null,
    }))
);
