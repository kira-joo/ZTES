// @vitest-environment node
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { AssetProvider } from "@kira-joo/backend-toolkit-core";
import { describe, expect, it, vi } from "vitest";
import { createImageImporter } from "./image-importer";

function fakeProvider(): AssetProvider & { uploadImage: ReturnType<typeof vi.fn> } {
  let n = 0;
  return {
    uploadImage: vi.fn(async () => ({ provider: "cloudinary", publicId: `ztes/x/${++n}`, secureUrl: `https://res.cloudinary.com/x/${n}.webp`, format: "webp", width: 10, height: 10, bytes: 1 }) as never),
    uploadVideo: vi.fn(),
    destroyAsset: vi.fn(),
  } as never;
}

const okFetch = vi.fn(async () => new Response(new Uint8Array([1, 2, 3]))) as unknown as typeof fetch;

describe("image importer", () => {
  it("uploads each source once and reuses it across runs via the map file", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "ztes-img-"));
    const mapFile = path.join(dir, "map.json");
    const provider = fakeProvider();

    const first = await createImageImporter({ provider, mapFile, onWarning: () => undefined, fetchImpl: okFetch });
    const [a, b] = await Promise.all([first.import("https://cdn/x.png", "ztes/p"), first.import("https://cdn/x.png", "ztes/p")]);
    expect(a).toEqual(b);
    expect(provider.uploadImage).toHaveBeenCalledTimes(1);
    await first.flush();
    expect(JSON.parse(await readFile(mapFile, "utf8"))["https://cdn/x.png"].publicId).toBe("ztes/x/1");

    const second = await createImageImporter({ provider, mapFile, onWarning: () => undefined, fetchImpl: okFetch });
    expect((await second.import("https://cdn/x.png", "ztes/p"))?.publicId).toBe("ztes/x/1");
    expect(provider.uploadImage).toHaveBeenCalledTimes(1);
    expect(second.reused).toBe(1);
  });

  it("returns null and warns on a failed download, and does nothing without a provider", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "ztes-img-"));
    const warnings: string[] = [];
    const failing = vi.fn(async () => new Response("nope", { status: 404 })) as unknown as typeof fetch;
    const importer = await createImageImporter({ provider: fakeProvider(), mapFile: path.join(dir, "m.json"), onWarning: (w) => warnings.push(w), fetchImpl: failing });
    expect(await importer.import("https://cdn/missing.png", "ztes/p")).toBeNull();
    expect(warnings[0]).toContain("HTTP 404");

    const noProvider = await createImageImporter({ provider: null, mapFile: path.join(dir, "n.json"), onWarning: () => undefined, fetchImpl: okFetch });
    expect(await noProvider.import("https://cdn/x.png", "ztes/p")).toBeNull();
  });
});
