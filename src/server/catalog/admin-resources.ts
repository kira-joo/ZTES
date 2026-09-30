import { CacheTag } from "src/server/core/revalidation/cache-tag";
import { brandRepository, categoryRepository } from "src/server/core/repositories";
import { BRAND_ASSET_FIELDS, CATEGORY_ASSET_FIELDS } from "./asset-fields";
import { assertBrandDeletable, assertCategoryDeletable, assertValidCategoryParent, brandPayload, categoryPayload } from "./catalog.service";
import { BrandDto, CategoryDto, ListBrandsQueryDto, ListCategoriesQueryDto } from "./dto/catalog.dto";

export const categoryCrud = {
  repository: categoryRepository,
  dto: CategoryDto,
  listQuery: ListCategoriesQueryDto,
  tags: [CacheTag.CATEGORIES, CacheTag.PRODUCTS, CacheTag.HOME],
  assetFields: CATEGORY_ASSET_FIELDS,
  assetFolder: "ztes/categories",
  toEntity: async (dto: CategoryDto, { id }: { id?: string }) => {
    await assertValidCategoryParent(id ?? null, dto.parent);
    return categoryPayload(dto);
  },
  beforeDelete: assertCategoryDeletable,
};

export const brandCrud = {
  repository: brandRepository,
  dto: BrandDto,
  listQuery: ListBrandsQueryDto,
  tags: [CacheTag.BRANDS, CacheTag.PRODUCTS, CacheTag.HOME],
  assetFields: BRAND_ASSET_FIELDS,
  assetFolder: "ztes/brands",
  toEntity: (dto: BrandDto) => brandPayload(dto),
  beforeDelete: assertBrandDeletable,
};
