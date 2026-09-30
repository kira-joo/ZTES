import type { AssetProvider } from "@kira-joo/backend-toolkit-core";
import type { ParsedMultipartFile } from "@kira-joo/backend-toolkit-next";
import type { ImageAsset } from "@kira-joo/toolkit-common";
import type { AssetFieldConfig } from "./asset-field-config.interface";
import { getAtPath } from "./process-asset-upload-fields";

/**
 * Post-save cleanup for a successful update: destroys the previous document's
 * asset for any field that was replaced or explicitly cleared.
 *
 * Called only after the save succeeded, and always awaited. A failure is
 * logged and swallowed — the entity is already updated, and rolling that back
 * over a cleanup hiccup would be worse than the orphan it leaves.
 *
 * A field that received neither a new file nor an explicit `null` is untouched;
 * no destroy call happens for it at all.
 */
export async function destroyReplacedAssets({
  provider,
  fields,
  files,
  payload,
  previousDocument,
}: {
  provider: AssetProvider | null;
  fields: readonly AssetFieldConfig[];
  files: Record<string, ParsedMultipartFile>;
  payload: Record<string, unknown>;
  previousDocument: Record<string, unknown>;
}): Promise<void> {
  // With no storage configured there is no stored asset to have replaced.
  if (!provider) return;

  for (const field of fields) {
    for (const publicId of singleOrphan(files, payload, previousDocument, field.name)) {
      try {
        await provider.destroyAsset(publicId, "image");
      } catch (error) {
        console.error(`Failed to clean up replaced or cleared asset ${publicId}`, error);
      }
    }
  }
}

function singleOrphan(
  files: Record<string, ParsedMultipartFile>,
  payload: Record<string, unknown>,
  previousDocument: Record<string, unknown>,
  name: string
): string[] {
  const replaced = Boolean(files[name]);
  const cleared = getAtPath(payload, name) === null;
  if (!replaced && !cleared) return [];

  const previous = getAtPath(previousDocument, name) as ImageAsset | undefined;
  return previous?.publicId ? [previous.publicId] : [];
}
