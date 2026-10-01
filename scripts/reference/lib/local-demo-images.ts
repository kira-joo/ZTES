/**
 * A small pool of real reference-site product photos, copied once into
 * `public/images/demo/`, used **only** to make the initial client-handoff demo
 * look visually complete while Cloudinary is not yet configured.
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
 * MOST of the reference site's product photos are NOT usable here: Orkida
 * stamps a semi-transparent "أوركيدا / orkidaagri / orkidastore.com" watermark
 * centred over the product, and some are full marketing graphics carrying
 * Orkida's phone number, Instagram handle and card-payment badges. Roughly 90%
 * of the ~410 images screened were branded.
 *
 * Two earlier versions of this pool shipped branded images. The first (12
 * images, all branded, the hero carrying Orkida's phone number) was picked
 * without being looked at. The second passed a thumbnail check that only
 * exposes gray-on-white marks — over coloured packaging, and at thumbnail
 * size, the watermark is invisible; it was obvious at hero size.
 *
 * The only reliable check: look at the image at FULL resolution after
 * histogram equalization (PIL `ImageOps.equalize`), which makes the overlay
 * stand out wherever it sits. Every image below passed that. Any replacement
 * must pass it too — never add an image unseen, and never judge from a thumbnail.
 *
 * Provenance, in file order (03 and 08 were removed after failing the
 * full-resolution check; their names are deliberately not reused):
 * 01 Brigand D bait        https://cdn.salla.sa/pGZrN/GL5h5BS8zmgaTgLj9F7HtFQGK5gCQQJGHeboWIj3.png
 * 02 Dapkiol mix           https://cdn.salla.sa/pGZrN/37VeGKUJDKdSXZXdTRxNryBNnlkNqxqrgoY1sgqY.jpg
 * 04 Advion WDG pack       https://cdn.salla.sa/pGZrN/OVvFeLTtfIaa4DISrCbLLSOfaRyvvHEuhUKrSWjt.jpg
 * 05 Imidasect gel         https://cdn.salla.sa/pGZrN/G63qRChi5SDaCPtICTe0FYQBGX5sNVnNslVJhnmD.png
 * 06 Outdoor fly trap      https://cdn.salla.sa/pGZrN/qzRxmeSPftHz0dt2aNpbkF2XIR8HAwwM9RuLcSJg.jpg
 * 07 Snap rat trap         https://cdn.salla.sa/pGZrN/iuHGzQT7Y4gTEZHfBwIBQEYKIo6Deqa9uI41TNC7.jpg
 * 09 Ecospray hand sprayer https://cdn.salla.sa/pGZrN/db5b5e85-b429-41a7-9dd6-ba417c9d022b-1000x1000-ts0jc0QBFHHYU8QLpmlBLWXsy9cCaP0ephXnE3yz.jpg
 * 10 Garden 10 sprayer     https://cdn.salla.sa/pGZrN/XKYybL2csbyE90jvJuyknqtZcwc84dVn4DAzrVMc.jpg
 * 11 Garden trowel        https://cdn.salla.sa/pGZrN/TRVtjlemN7qSJiwQEomQDkw9MMfme2BKZQh6DFX3.jpg
 * 12 Hedge shears         https://cdn.salla.sa/pGZrN/a6452108-5aa9-4b48-acb0-63397e7adb26-1000x666-kwXd0r4h3iF1PM4gom1C3hyWcv101RPBMexLghjD.jpg
 * 13 Potted grass         https://cdn.salla.sa/pGZrN/579f71d3-273b-4dcb-a378-212420e9761f-1000x1000-uwDKhK7oEYJfFZUfvYqCNjdQoIAjO6zt4wdyvvNw.jpg
 *
 * File names are new to each version, so no optimizer, browser or CDN cache
 * can serve a branded predecessor's pixels under a familiar URL.
 */
const POOL: readonly PoolEntry[] = [
  { file: "demo-01.png", format: "png", width: 1000, height: 1000, bytes: 446195 },
  { file: "demo-02.jpg", format: "jpg", width: 1000, height: 666, bytes: 43943 },
  { file: "demo-04.jpg", format: "jpg", width: 1000, height: 666, bytes: 93495 },
  { file: "demo-05.png", format: "png", width: 1000, height: 666, bytes: 132529 },
  { file: "demo-06.jpg", format: "jpg", width: 1000, height: 666, bytes: 57886 },
  { file: "demo-07.jpg", format: "jpg", width: 1000, height: 666, bytes: 56859 },
  { file: "demo-09.jpg", format: "jpg", width: 1000, height: 1000, bytes: 34966 },
  { file: "demo-10.jpg", format: "jpg", width: 1000, height: 666, bytes: 20534 },
  { file: "demo-11.jpg", format: "jpg", width: 1000, height: 666, bytes: 48645 },
  { file: "demo-12.jpg", format: "jpg", width: 1000, height: 666, bytes: 14577 },
  { file: "demo-13.jpg", format: "jpg", width: 1000, height: 1000, bytes: 42098 },
];

/** Stable, non-cryptographic string hash — just needs to spread keys evenly across the pool. */
function hashKey(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (Math.imul(h, 31) + key.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Deterministic by `key`, so re-seeding never shuffles which demo photo an
 * item shows. Pass something unique per item: the source URL works for
 * products (each has its own photos), but every reference category shares ONE
 * source image (the store logo), so categories must be keyed by their own id —
 * keyed by URL they would all collapse onto a single photo.
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
