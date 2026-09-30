// @vitest-environment node
import { toMoney } from "@kira-joo/toolkit-common";
import { describe, expect, it, vi } from "vitest";
import { ProductSort } from "src/common/enums";
import { BrandModel } from "src/server/catalog/brand.schema";
import { CategoryModel } from "src/server/catalog/category.schema";
import { buildProductSearchText } from "src/server/catalog/product-search-text";
import { makeProduct } from "src/test/fixtures";
import { setupTestDatabase } from "src/test/mongo";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: () => unknown) => fn, revalidateTag: vi.fn() }));

setupTestDatabase();

async function catalog() {
  const root = await CategoryModel.create({ name: { ar: "مكافحة", en: "Control" }, slug: { ar: "مكافحة", en: "control" } });
  const child = await CategoryModel.create({
    name: { ar: "صراصير", en: "Cockroaches" },
    slug: { ar: "صراصير", en: "cockroaches" },
    parent: root._id,
  });
  const brand = await BrandModel.create({ name: { ar: "سينجينتا", en: "Syngenta" }, slug: { ar: "سينجينتا", en: "syngenta" } });
  const name = { ar: "أدفيون جل", en: "Advion gel" };
  const gel = await makeProduct({
    name,
    categories: [child._id],
    primaryCategory: child._id,
    brand: brand._id,
    price: toMoney("89.00"),
    compareAtPrice: toMoney("109.00"),
    soldCount: 50,
    ratingAverage: 4.9,
    searchText: buildProductSearchText({ name, brandName: brand.name }),
  });
  const spray = await makeProduct({ categories: [root._id], price: toMoney("15.00"), soldCount: 5 });
  await makeProduct({ categories: [root._id], isActive: false });
  await makeProduct({ categories: [root._id], deletedAt: new Date() });
  return { root, child, brand, gel, spray };
}

describe("storefront catalog reads", () => {
  it("lists a parent category with its sub-categories' products, active only, with facets", async () => {
    const { listProducts } = await import("./catalog.reads");
    const { root, child, brand } = await catalog();
    const list = await listProducts({ category: String(root._id), sort: ProductSort.PRICE_LOW });
    expect(list.total).toBe(2);
    expect(list.items.map((item) => item.price)).toEqual(["15.00", "89.00"]);
    expect(list.facets.categories).toEqual([expect.objectContaining({ _id: String(child._id), count: 1 })]);
    expect(list.facets.brands).toEqual([expect.objectContaining({ _id: String(brand._id), count: 1 })]);
  });

  it("sorts best selling and filters offers", async () => {
    const { listProducts } = await import("./catalog.reads");
    const { gel } = await catalog();
    expect((await listProducts({ sort: ProductSort.BEST_SELLING })).items[0]!._id).toBe(String(gel._id));
    const offers = await listProducts({ onSale: true });
    expect(offers.items.map((item) => item._id)).toEqual([String(gel._id)]);
    expect(offers.items[0]!.compareAtPrice).toBe("109.00");
  });

  it("finds a product through Arabic spelling variants", async () => {
    const { listProducts } = await import("./catalog.reads");
    const { gel } = await catalog();
    const hits = await listProducts({ search: "ادفيون" });
    expect(hits.items.map((item) => item._id)).toEqual([String(gel._id)]);
  });

  it("resolves a product by either locale's slug with its breadcrumb", async () => {
    const { getProductBySlug } = await import("./catalog.reads");
    const { gel, root, child } = await catalog();
    const product = await getProductBySlug("en", gel.slug.en);
    expect(product?._id).toBe(String(gel._id));
    expect(product?.breadcrumb.map((crumb) => crumb._id)).toEqual([String(root._id), String(child._id)]);
    expect(product?.brand?.name.en).toBe("Syngenta");
    expect(await getProductBySlug("ar", "missing")).toBeNull();
  });
});
