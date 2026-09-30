import type { SearchResultView } from "src/common/types/storefront";
import { CategoryModel } from "src/server/catalog/category.schema";
import { normalizeSearchText } from "src/server/engines/normalize";
import { listProducts } from "./catalog.reads";

function escape(term: string) {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function searchCatalog(query: string, limit: number): Promise<SearchResultView> {
  const normalized = normalizeSearchText(query);
  if (normalized.length < 2) return { products: [], categories: [] };

  const [products, categories] = await Promise.all([
    listProducts({ search: query, limit }),
    CategoryModel.find({
      isActive: true,
      $or: [{ "name.ar": { $regex: escape(query.trim()), $options: "i" } }, { "name.en": { $regex: escape(query.trim()), $options: "i" } }],
    })
      .limit(5)
      .select("name slug")
      .lean(),
  ]);
  return {
    products: products.items,
    categories: categories.map((category) => ({ _id: String(category._id), name: category.name, slug: category.slug })),
  };
}
