import { faqCrud } from "src/server/content/admin-resources";
import { adminCollectionRoutes } from "src/server/core/crud/admin-crud";

export const dynamic = "force-dynamic";

export const { GET, POST } = adminCollectionRoutes(faqCrud);
