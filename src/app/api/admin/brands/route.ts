import { brandCrud } from "src/server/catalog/admin-resources";
import { adminCollectionRoutes } from "src/server/core/crud/admin-crud";

export const dynamic = "force-dynamic";

/**
 * Read-only: brands have no admin create/edit/delete screen (see
 * docs/implementation-plan.md's "Scope correction"). This list is used only
 * to populate the product form's brand picker.
 */
export const { GET } = adminCollectionRoutes(brandCrud);
