import type { UploadPolicy } from "@kira-joo/toolkit-common";

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp"];

function imagePolicy(maxMb: number, minWidth: number, minHeight: number): UploadPolicy {
  return {
    allowedMimeTypes: IMAGE_MIME_TYPES,
    allowedFormats: IMAGE_FORMATS,
    maxBytes: maxMb * 1024 * 1024,
    minWidth,
    minHeight,
  };
}

/** Product photos are square-ish packshots on the reference site (500–1000px). */
export const productImagePolicy = imagePolicy(8, 300, 300);
export const categoryImagePolicy = imagePolicy(5, 64, 64);
export const bannerImagePolicy = imagePolicy(8, 600, 150);
export const logoImagePolicy = imagePolicy(2, 64, 32);
export const contentImagePolicy = imagePolicy(8, 200, 100);
