import type { ImageAsset } from "@kira-joo/toolkit-common";
import Image from "next/image";

/**
 * A Cloudinary image with its blur placeholder, or a neutral tile when the
 * record has none yet (e.g. imported before Cloudinary was configured).
 *
 * `priority` maps to `loading="eager"` + `fetchPriority="high"`, not Next's
 * `preload`: Next 16 deprecated `priority`, and its docs advise against
 * `preload` when several images can be the LCP depending on the viewport —
 * which is the hero's separate desktop/mobile artwork.
 */
export function StoreImage({
  image,
  alt,
  sizes,
  className = "",
  priority = false,
  fit = "contain",
}: {
  image: ImageAsset | null | undefined;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  fit?: "contain" | "cover";
}) {
  if (!image?.secureUrl) {
    return <div aria-hidden="true" className={`bg-band/60 ${className}`} />;
  }
  return (
    <Image
      src={image.secureUrl}
      alt={alt}
      fill
      sizes={sizes}
      {...(priority ? { loading: "eager" as const, fetchPriority: "high" as const } : {})}
      className={`${fit === "contain" ? "object-contain" : "object-cover"} ${className}`}
      {...(image.placeholderUrl ? { placeholder: "blur" as const, blurDataURL: image.placeholderUrl } : {})}
    />
  );
}
