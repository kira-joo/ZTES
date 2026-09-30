import { readFile, writeFile } from "node:fs/promises";
import type { AssetProvider } from "@kira-joo/backend-toolkit-core";
import type { ImageAsset } from "@kira-joo/toolkit-common";

/**
 * Downloads a reference image once and uploads it through the app's asset
 * provider (Cloudinary). The source URL → asset map is persisted, so a re-run
 * reuses every asset already uploaded instead of uploading it again.
 */
export interface ImageImporter {
  import(sourceUrl: string, folder: string): Promise<ImageAsset | null>;
  flush(): Promise<void>;
  readonly uploaded: number;
  readonly reused: number;
}

export async function createImageImporter(options: {
  provider: AssetProvider | null;
  mapFile: string;
  onWarning: (message: string) => void;
  fetchImpl?: typeof fetch;
}): Promise<ImageImporter> {
  const fetchImpl = options.fetchImpl ?? fetch;
  let map: Record<string, ImageAsset> = {};
  try {
    map = JSON.parse(await readFile(options.mapFile, "utf8")) as Record<string, ImageAsset>;
  } catch {
    map = {};
  }
  const inFlight = new Map<string, Promise<ImageAsset | null>>();
  let uploaded = 0;
  let reused = 0;
  let dirty = false;

  async function upload(sourceUrl: string, folder: string): Promise<ImageAsset | null> {
    if (!options.provider) return null;
    try {
      const response = await fetchImpl(sourceUrl, { signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      const asset = await options.provider.uploadImage(buffer, { folder });
      map[sourceUrl] = asset;
      dirty = true;
      uploaded += 1;
      if (uploaded % 25 === 0) await flush();
      return asset;
    } catch (error) {
      options.onWarning(`image ${sourceUrl}: ${(error as Error).message}`);
      return null;
    }
  }

  async function flush() {
    if (!dirty) return;
    await writeFile(options.mapFile, JSON.stringify(map, null, 2));
    dirty = false;
  }

  return {
    async import(sourceUrl, folder) {
      if (map[sourceUrl]) {
        reused += 1;
        return map[sourceUrl]!;
      }
      if (!inFlight.has(sourceUrl)) inFlight.set(sourceUrl, upload(sourceUrl, folder));
      return inFlight.get(sourceUrl)!;
    },
    flush,
    get uploaded() {
      return uploaded;
    },
    get reused() {
      return reused;
    },
  };
}
