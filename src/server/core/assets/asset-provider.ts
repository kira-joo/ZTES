import { createCloudinaryProvider } from "@kira-joo/backend-toolkit-cloudinary";
import { ServiceUnavailableError, type AssetProvider } from "@kira-joo/backend-toolkit-core";
import type { ParsedMultipartFile } from "@kira-joo/backend-toolkit-next";
import type { AssetFieldConfig } from "./asset-field-config.interface";

/**
 * Public image storage — menu photographs, category tiles, brand images.
 *
 * Credentials come from the environment and nowhere else; the package never
 * reads them itself, which is what keeps it application-agnostic.
 *
 * Unwrapped, unlike nutrition's. That app guards `destroyAsset` so an asset
 * belonging to a published Edition survives a delete — this product has no
 * concept of a published edition, so a guard here would be a rule with nothing
 * to enforce.
 *
 * ## `null` when unconfigured
 *
 * The same shape opening hours and payment settings arrived at: a capability
 * that is OFF must stay distinguishable from one that works, all the way to the
 * caller. It does not fail the boot — missing credentials corrupt nothing, they
 * only mean images cannot be uploaded, and refusing to start would take away
 * every other screen. `announce-store-readiness.ts` says so once, loudly.
 */
let cached: AssetProvider | null | undefined;

export function assetProvider(): AssetProvider | null {
  if (cached !== undefined) return cached;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  cached =
    cloudName && apiKey && apiSecret ? createCloudinaryProvider({ cloudName, apiKey, apiSecret }) : null;

  return cached;
}

/**
 * The same, for a route that cannot proceed without it.
 *
 * The message names the real cause. "Upload failed" for an unconfigured store
 * sends an operator to try a smaller file, forever.
 */
export function requireAssetProvider(): AssetProvider {
  const provider = assetProvider();

  if (!provider) {
    throw new ServiceUnavailableError(
      "Image uploads are not configured for this store. Set the Cloudinary credentials and try again."
    );
  }

  return provider;
}

/**
 * The provider a request needs, or `null` if it provably needs none.
 *
 * An asset-bearing route must not call `requireAssetProvider()` outright. Most
 * requests to those routes carry no file — an operator renaming a dish, fixing
 * a price, toggling availability — and with no credentials configured that
 * would refuse every one of them. The store would lose its whole catalogue
 * screen over an image feature nobody had asked it to use yet.
 *
 * So the requirement follows the file:
 *
 * - a request that carries a file and has no storage **fails**, naming the real
 *   cause, because silently saving an entity without the photograph somebody
 *   just picked is the worst of the three outcomes;
 * - a request that carries no file gets whatever is configured, so an explicit
 *   clear still cleans up after itself;
 * - unconfigured *and* no file returns `null`, which is a no-op that cannot
 *   hide anything: with no credentials there is no stored asset to act on.
 */
export function assetProviderForFiles(
  files: Record<string, ParsedMultipartFile>,
  fields: readonly AssetFieldConfig[]
): AssetProvider | null {
  const carriesFile = fields.some((field) => files[field.name]);

  return carriesFile ? requireAssetProvider() : assetProvider();
}
