import type { UploadPolicy } from "@kira-joo/toolkit-common";

/**
 * One asset-bearing field on an entity.
 *
 * **Images only.** Nothing in this application stores video — no
 * `videoAssetField`, no `VideoAsset`, no `uploadVideo` call anywhere — so there
 * is no `kind` discriminator here and no video branch downstream. Nutrition
 * carries one because it has videos; a branch this app can never reach would be
 * a description of behaviour that does not exist.
 */
export interface AssetFieldConfig {
  /** The payload key. May be dotted for a nested field. */
  name: string;
  policy: UploadPolicy;
}
