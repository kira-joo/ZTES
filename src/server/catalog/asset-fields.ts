import type { AssetFieldConfig } from "src/server/core/assets";
import { bannerImagePolicy, categoryImagePolicy, logoImagePolicy, productImagePolicy } from "src/server/core/assets";

export const CATEGORY_ASSET_FIELDS: AssetFieldConfig[] = [
  { name: "image", policy: categoryImagePolicy },
  { name: "icon", policy: categoryImagePolicy },
  { name: "banner", policy: bannerImagePolicy },
];

export const BRAND_ASSET_FIELDS: AssetFieldConfig[] = [{ name: "logo", policy: logoImagePolicy }];

/** Product gallery images upload one per request to the images sub-resource. */
export const PRODUCT_IMAGE_FIELD: AssetFieldConfig = { name: "file", policy: productImagePolicy };
