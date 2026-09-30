import type { AssetProvider } from "@kira-joo/backend-toolkit-core";
import type { UploadedAssetRef } from "./process-asset-upload-fields";

/**
 * The rollback path: destroys everything a failed request uploaded.
 *
 * Always awaited, never fire-and-forget — a serverless runtime can be torn
 * down the instant the response is sent, and a detached promise is how an
 * orphan is created rather than cleaned up.
 *
 * A destroy failure is logged and swallowed. The caller is in the middle of
 * throwing the error that actually matters, and replacing it with a Cloudinary
 * cleanup error would hide why the save failed.
 */
export async function destroyUploadedAssets(
  provider: AssetProvider | null,
  uploaded: readonly UploadedAssetRef[]
): Promise<void> {
  // Nothing was uploaded without a provider, so `uploaded` is empty anyway.
  if (!provider) return;

  for (const asset of uploaded) {
    try {
      await provider.destroyAsset(asset.publicId, "image");
    } catch (error) {
      console.error(`Failed to roll back uploaded asset ${asset.publicId} after a save failure`, error);
    }
  }
}
