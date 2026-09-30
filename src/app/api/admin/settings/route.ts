import { StoreSettingsModel } from "src/server/content/store-settings.schema";
import { StoreSettingsDto } from "src/server/content/dto/content.dto";
import { SETTINGS_ASSET_FIELDS, settingsPayload } from "src/server/content/settings-admin";
import { getSettingsDocument } from "src/server/content/settings.service";
import { cleanupReplacedAssets, parseEntityPayload, persistWithAssets } from "src/server/core/crud/entity-payload";
import { CacheTag } from "src/server/core/revalidation/cache-tag";
import { createGetRoute, createPutRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  auth: true,
  handler: async () => getSettingsDocument(),
});

/** The whole settings document. Touches every page, so it invalidates everything. */
export const PUT = createPutRoute({
  auth: true,
  handler: async ({ request }) => {
    const previous = await getSettingsDocument();
    const parsed = await parseEntityPayload(request, StoreSettingsDto, SETTINGS_ASSET_FIELDS, "ztes/settings");
    const updated = await persistWithAssets(parsed, () =>
      StoreSettingsModel.findOneAndUpdate({ _id: previous._id }, { $set: settingsPayload(parsed.dto) }, { returnDocument: "after" }).lean()
    );
    await cleanupReplacedAssets(parsed, previous);
    return updated;
  },
  revalidateTags: [
    CacheTag.SETTINGS,
    CacheTag.HOME,
    CacheTag.CATEGORIES,
    CacheTag.PRODUCTS,
    CacheTag.PAGES,
    CacheTag.POSTS,
  ],
});
