"use client";

import { modalPresentation, useDialog, type DialogContentProps } from "@kira-joo/frontend-toolkit-tailwind/dialog";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRef, useState } from "react";
import type { ImageAsset } from "src/common/types/storefront";
import { StoreImage } from "src/components/store/store-image";

function useSwipe(onLeft: () => void, onRight: () => void) {
  const startX = useRef<number | null>(null);
  return {
    onTouchStart: (event: React.TouchEvent) => {
      startX.current = event.touches[0]?.clientX ?? null;
    },
    onTouchEnd: (event: React.TouchEvent) => {
      if (startX.current === null) return;
      const delta = (event.changedTouches[0]?.clientX ?? startX.current) - startX.current;
      if (Math.abs(delta) > 40) (delta < 0 ? onLeft : onRight)();
      startX.current = null;
    },
  };
}

function Lightbox({ images, index: initialIndex, alt, dismiss, titleId }: DialogContentProps & { images: ImageAsset[]; index: number; alt: string }) {
  const t = useTranslations("product.gallery");
  const [index, setIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);
  const go = (delta: number) => {
    setZoomed(false);
    setIndex((current) => (current + delta + images.length) % images.length);
  };
  const swipe = useSwipe(
    () => go(1),
    () => go(-1)
  );
  const image = images[index];

  return (
    <div className="relative flex h-full w-full flex-col bg-ink/95">
      <h2 id={titleId} className="sr-only">
        {alt}
      </h2>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("close")}
        className="absolute end-3 top-3 z-10 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <X className="size-5" aria-hidden="true" />
      </button>
      <div className="relative flex-1 overflow-hidden" {...swipe}>
        {image?.secureUrl ? (
          <button
            type="button"
            onClick={() => setZoomed((value) => !value)}
            className="absolute inset-0 cursor-zoom-in"
            aria-label={t("zoom")}
          >
            <Image
              src={image.secureUrl}
              alt={alt}
              fill
              sizes="100vw"
              className={`object-contain transition-transform duration-300 ${zoomed ? "scale-150 cursor-zoom-out" : ""}`}
            />
          </button>
        ) : (
          <StoreImage image={null} alt={alt} sizes="100vw" className="absolute inset-0" />
        )}
      </div>
      {images.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={t("previous")}
            className="absolute start-2 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <ChevronRight className="size-5 rtl:hidden" aria-hidden="true" />
            <ChevronLeft className="hidden size-5 rtl:block" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={t("next")}
            className="absolute end-2 top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <ChevronLeft className="size-5 rtl:hidden" aria-hidden="true" />
            <ChevronRight className="hidden size-5 rtl:block" aria-hidden="true" />
          </button>
          <div className="flex justify-center gap-1.5 pb-4 pt-3">
            {images.map((_, dot) => (
              <span key={dot} className={`size-1.5 rounded-full ${dot === index ? "bg-white" : "bg-white/30"}`} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

/**
 * Main image with thumbnail rail; tap/click opens the swipeable, zoomable
 * lightbox. `images` is never empty on the caller's side in practice, but an
 * empty array still renders a tidy placeholder via `<StoreImage>`.
 */
export function ProductGallery({ images, alt }: { images: ImageAsset[]; alt: string }) {
  const t = useTranslations("product.gallery");
  const { openDialog } = useDialog();
  const [index, setIndex] = useState(0);
  const swipe = useSwipe(
    () => setIndex((current) => (current + 1) % Math.max(images.length, 1)),
    () => setIndex((current) => (current - 1 + Math.max(images.length, 1)) % Math.max(images.length, 1))
  );

  const openLightbox = () =>
    openDialog({ component: Lightbox, props: { images, index, alt }, presentation: modalPresentation({ size: "full", className: "bg-ink" }) });

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-card bg-card shadow-card" {...swipe}>
        <button type="button" onClick={openLightbox} className="absolute inset-0" aria-label={t("zoom")}>
          <StoreImage image={images[index] ?? null} alt={alt} sizes="(min-width: 1024px) 40vw, 100vw" priority className="p-6" />
        </button>
        {images.length > 0 ? (
          <span className="absolute bottom-3 end-3 grid size-9 place-items-center rounded-full bg-card/90 text-ink shadow-card">
            <ZoomIn className="size-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {images.map((image, thumbIndex) => (
            <button
              key={thumbIndex}
              type="button"
              onClick={() => setIndex(thumbIndex)}
              aria-label={t("thumbnail", { index: thumbIndex + 1 })}
              aria-current={thumbIndex === index}
              className={`relative size-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                thumbIndex === index ? "border-brand" : "border-line hover:border-brand-light"
              }`}
            >
              <StoreImage image={image} alt="" sizes="64px" className="p-1" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
