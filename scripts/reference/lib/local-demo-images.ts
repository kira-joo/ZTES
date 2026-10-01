/**
 * A small pool of real reference-site product photos, downloaded once into
 * `public/images/demo/` (see `download-demo-images.ts`), used **only** to make
 * the initial client-handoff demo look visually complete while Cloudinary is
 * not yet configured.
 *
 * This is NOT a second image architecture: every value here is an ordinary
 * `ImageAsset` — the exact shape Cloudinary produces — just pointing at a
 * local `/public` path instead of a Cloudinary URL. `StoreImage` and every
 * other consumer render it identically either way. Once Cloudinary is
 * configured, Admin replaces any product's image through the existing upload
 * flow and the stored `ImageAsset` becomes a real Cloudinary one — no code
 * change required.
 *
 * `provider` is tagged `CLOUDINARY` only because `AssetProviderType` has no
 * other value (adding one would be the "second architecture" this is
 * explicitly avoiding). The `local-demo/` `publicId` prefix is what actually
 * marks these as not real uploads — `destroyAsset` calls against them fail
 * harmlessly and are swallowed (see `destroy-replaced-assets.ts`).
 */
import { AssetProviderType, type ImageAsset } from "@kira-joo/toolkit-common";

interface PoolEntry {
  file: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

/**
 * Provenance — each file is an unmodified download of the reference site's
 * own product photography (`cdn.salla.sa`), in the same numeric order:
 *
 * 01 https://cdn.salla.sa/pGZrN/RbOSpED3AnX2kRwECJsg7FuQMMafxiTXUL1J3hBB.png
 * 02 https://cdn.salla.sa/pGZrN/9ee8ca6f-40ed-4b85-9b4c-3b9778fcb93a-1000x1000-KjWkAc7fj4Jx2qPL3J0QAvY0IOXCCF3ztsgnTSYe.png
 * 03 https://cdn.salla.sa/pGZrN/e2b63649-c2b1-4130-969b-ad7504fea309-1000x1000-LLb0aTIX6TT9iInXU4XvrQqqr8uxxLdyIAEIrU4g.png
 * 04 https://cdn.salla.sa/pGZrN/593235ad-30af-43c8-b9f0-6159b49a87dd-1000x1000-a90PgQjqKhDeVKysylbt9KlTpnQFPnierTHFeuW8.png
 * 05 https://cdn.salla.sa/pGZrN/b2f12664-93ce-4836-b890-dfaa6505a87a-1000x925.06938020352-jX9NmkigxkD8E06leHWgOtB2auR4bDdMFl61Ue3A.png
 * 06 https://cdn.salla.sa/pGZrN/noX4bU9guoMYz8JdtkJuiGEwTZj9cQs5oS181R3b.png
 * 07 https://cdn.salla.sa/pGZrN/uMv6p54YlkRWvUmREbRMldHNKYGkTJv1z4L56mgR.png
 * 08 https://cdn.salla.sa/pGZrN/oDZZL5cL9Zeb1faOItVoqjbHV0X31Tqz8oT4w4UT.png
 * 09 https://cdn.salla.sa/pGZrN/ezvbyPPTpjI8icIXXx7AwDBLR4Vd79kpt9VaPkzt.png
 * 10 https://cdn.salla.sa/pGZrN/jN6QoykcOhywJ2qwNb2z3eL1d3rVtAtU6TEuDy0d.png
 * 11 https://cdn.salla.sa/pGZrN/NPjNnmBGUiXxI4XNGNf3w3YaTWZqplOxxnrm9Ktp.png
 * 12 https://cdn.salla.sa/pGZrN/8662c96e-dbcd-4813-8fcf-5193c3daec7d-1000x1000-aBPP6MHi9r3HvVoiTjz631KZZBb62z0a207JqTv3.png
 *
 * Ordinary product packaging photography — not Orkida's business identity
 * (no logo, no contact/social info, no people) — the same category of asset
 * already sanctioned for real catalog import. See docs/implementation-plan.md's
 * "Scope correction" for why contact/social/legal/testimonial content is
 * treated differently from product/catalog imagery.
 */
const POOL: readonly PoolEntry[] = [
  { file: "sample-01.png", format: "png", width: 1000, height: 925, bytes: 247532 },
  { file: "sample-02.png", format: "png", width: 1000, height: 1000, bytes: 208727 },
  { file: "sample-03.png", format: "png", width: 1000, height: 1000, bytes: 328306 },
  { file: "sample-04.png", format: "png", width: 1000, height: 1000, bytes: 466105 },
  { file: "sample-05.png", format: "png", width: 1000, height: 925, bytes: 105940 },
  { file: "sample-06.png", format: "png", width: 1000, height: 925, bytes: 119048 },
  { file: "sample-07.png", format: "png", width: 1000, height: 925, bytes: 292794 },
  { file: "sample-08.png", format: "png", width: 1000, height: 1000, bytes: 821340 },
  { file: "sample-09.png", format: "png", width: 1000, height: 1000, bytes: 523594 },
  { file: "sample-10.png", format: "png", width: 1000, height: 1000, bytes: 518072 },
  { file: "sample-11.png", format: "png", width: 999, height: 672, bytes: 381464 },
  { file: "sample-12.png", format: "png", width: 1000, height: 1000, bytes: 205294 },
];

/** Stable, non-cryptographic string hash — just needs to spread keys evenly across the pool. */
function hashKey(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (Math.imul(h, 31) + key.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Deterministic by `key` (pass the real reference image's source URL, or the
 * owning entity's slug) so re-seeding the same data never shuffles which demo
 * photo an item shows.
 */
export function pickLocalDemoImage(key: string): ImageAsset {
  const entry = POOL[hashKey(key) % POOL.length]!;
  return {
    provider: AssetProviderType.CLOUDINARY,
    publicId: `local-demo/${entry.file}`,
    secureUrl: `/images/demo/${entry.file}`,
    format: entry.format,
    width: entry.width,
    height: entry.height,
    bytes: entry.bytes,
  };
}
