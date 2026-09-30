import type { AssetProvider } from "@kira-joo/backend-toolkit-core";
import { validateUploadedFile, type ParsedMultipartFile } from "@kira-joo/backend-toolkit-next";
import type { AssetFieldConfig } from "./asset-field-config.interface";

export interface UploadedAssetRef {
  publicId: string;
}

export interface ProcessAssetUploadFieldsResult {
  /** Everything uploaded in this call — hand to `destroyUploadedAssets` if the save then fails. */
  uploaded: UploadedAssetRef[];
}

/** Reads a possibly-dotted path. Every field here is flat today; the split is one element then. */
export function getAtPath(source: Record<string, unknown>, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (value, key) =>
        value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined,
      source
    );
}

export function setAtPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split(".");
  const last = keys.pop()!;
  const parent = keys.reduce<Record<string, unknown>>((node, key) => {
    if (typeof node[key] !== "object" || node[key] === null) node[key] = {};
    return node[key] as Record<string, unknown>;
  }, target);

  parent[last] = value;
}

/**
 * Uploads the files a request carries and merges the results into its payload.
 *
 * The upload-on-submit convention: the route parses multipart, hands the parsed
 * files and the JSON payload here, and this validates each file against its
 * field's policy, uploads it, and writes the resulting `ImageAsset` into the
 * payload — overwriting whatever the client sent for that key, since a client
 * never legitimately holds real asset data.
 *
 * A field with no matching file is left completely alone, so the payload's own
 * value decides: omitted means unchanged, explicit `null` means clear.
 *
 * Mutates `payload` and returns what was uploaded, so a caller can roll all of
 * it back when the subsequent validation or save fails.
 *
 * ## Lists are not handled here, deliberately
 *
 * A multipart body carries one file per field name, so a list cannot arrive
 * under a single key, and `buildSubmitBody` — the toolkit function every form
 * here submits through — emits exactly one part per declared field. A menu
 * item's `images` and the profile's `chrome.gallery` therefore get their own
 * sub-resource routes, one file per request, which is what nutrition does with
 * its own image list for the same reason.
 *
 * An earlier version of this accepted `gallery.0`, `gallery.1`, … and appended
 * them. It worked and was tested, and it was a client convention with no
 * precedent in either app that nothing would have sent.
 */
export async function processAssetUploadFields({
  files,
  payload,
  fields,
  provider,
  folder,
}: {
  files: Record<string, ParsedMultipartFile>;
  payload: Record<string, unknown>;
  fields: readonly AssetFieldConfig[];
  provider: AssetProvider | null;
  folder: string;
}): Promise<ProcessAssetUploadFieldsResult> {
  const uploaded: UploadedAssetRef[] = [];

  /*
   * No storage configured. Reaching here with a file is not possible —
   * `assetProviderForFiles` throws on that exact combination — so this is the
   * no-file case, where there is nothing to do rather than something skipped.
   */
  if (!provider) return { uploaded };

  for (const field of fields) {
    const file = files[field.name];
    if (!file) continue;

    validateUploadedFile(file, field.policy);
    const asset = await provider.uploadImage(file.buffer, { folder });

    setAtPath(payload, field.name, asset);
    uploaded.push({ publicId: asset.publicId });
  }

  return { uploaded };
}
