"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import type { HomeMediaItemView } from "src/common/types/storefront";
import { SmartLink } from "src/components/store/smart-link";
import { StoreImage } from "src/components/store/store-image";

/**
 * Full-width hero slides (separate mobile artwork when provided), autoplay,
 * dots. Translates its own accessible labels — a Server Component cannot pass
 * a function prop (e.g. a `getTranslations` closure) across the RSC boundary.
 */
export function HeroSlider({ items, dir }: { items: HomeMediaItemView[]; dir: "rtl" | "ltr" }) {
  const t = useTranslations("home");
  const slideLabel = (index: number) => t("slide", { index });
  const [viewportRef, api] = useEmblaCarousel({ direction: dir, loop: items.length > 1 });
  const [selected, setSelected] = useState(0);
  const onSelect = useCallback(() => api && setSelected(api.selectedScrollSnap()), [api]);

  useEffect(() => {
    if (!api) return;
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, onSelect]);

  useEffect(() => {
    if (!api || items.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => api.scrollNext(), 6000);
    return () => window.clearInterval(id);
  }, [api, items.length]);

  if (items.length === 0) return null;
  return (
    <div className="relative overflow-hidden rounded-card">
      <div ref={viewportRef} className="overflow-hidden">
        <div className="flex">
          {items.map((item, index) => (
            <div key={item._id} className="min-w-0 shrink-0 grow-0 basis-full">
              <SmartLink href={item.href} className="block">
                <span className="relative hidden aspect-[1420/548] w-full md:block">
                  <StoreImage image={item.image} alt={item.title.ar || slideLabel(index + 1)} sizes="100vw" priority={index === 0} fit="cover" />
                </span>
                <span className="relative block aspect-[380/166] w-full md:hidden">
                  <StoreImage image={item.mobileImage ?? item.image} alt={item.title.ar || slideLabel(index + 1)} sizes="100vw" priority={index === 0} fit="cover" />
                </span>
              </SmartLink>
            </div>
          ))}
        </div>
      </div>
      {items.length > 1 ? (
        <div className="absolute bottom-4 start-6 flex gap-1.5">
          {items.map((item, index) => (
            <button
              key={item._id}
              type="button"
              onClick={() => api?.scrollTo(index)}
              aria-label={slideLabel(index + 1)}
              aria-current={index === selected}
              className={`h-2.5 rounded-full transition-all ${index === selected ? "w-6 bg-brand" : "w-2.5 bg-white/70"}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
