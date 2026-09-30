import { brandCrud } from "src/server/catalog/admin-resources";
import { adminItemRoutes } from "src/server/core/crud/admin-crud";

export const dynamic = "force-dynamic";

export const { GET, PUT, DELETE } = adminItemRoutes(brandCrud);
