"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HomeMediaItemView } from "src/common/types/storefront";
import { SmartLink } from "src/components/store/smart-link";
import { PAGE_CONTENT_SIZES as HERO_SIZES } from "src/components/store/image-sizes";
import { StoreImage } from "src/components/store/store-image";
import { useCarouselAutoplay } from "src/components/store/use-carousel-autoplay";
import { pickLocalized } from "src/lib/localized";

/**
 * Full-width hero slides (separate mobile artwork when provided), autoplay,
 * dots. Translates its own accessible labels — a Server Component cannot pass
 * a function prop (e.g. a `getTranslations` closure) across the RSC boundary.
 */
export function HeroSlider({ items, dir }: { items: HomeMediaItemView[]; dir: "rtl" | "ltr" }) {
  const t = useTranslations("home");
  const locale = useLocale();
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

  const rootRef = useRef<HTMLDivElement>(null);
  useCarouselAutoplay(api, items.length > 1 ? 6000 : undefined, rootRef);

  if (items.length === 0) return null;
  return (
    <div ref={rootRef} className="relative overflow-hidden rounded-card">
      <div ref={viewportRef} className="overflow-hidden">
        <div className="flex">
          {items.map((item, index) => (
            <div key={item._id} className="min-w-0 shrink-0 grow-0 basis-full">
              <SmartLink href={item.href} className="block">
                {/* The banner artwork's own ratio at every width: the headline is baked into the
                    image, so a narrower mobile frame would crop it. A wider slide anchors left,
                    where its text sits, and loses only photo on the right. */}
                <span className="relative hidden aspect-[2014/781] w-full md:block">
                  <StoreImage image={item.image} alt={pickLocalized(item.title, locale) || slideLabel(index + 1)} sizes={HERO_SIZES} priority={index === 0} fit="cover" className="object-left" />
                </span>
                <span className="relative block aspect-[2014/781] w-full md:hidden">
                  <StoreImage image={item.mobileImage ?? item.image} alt={pickLocalized(item.title, locale) || slideLabel(index + 1)} sizes={HERO_SIZES} priority={index === 0} fit="cover" className="object-left" />
                </span>
              </SmartLink>
            </div>
          ))}
        </div>
      </div>
      {items.length > 1 ? (
        // Centred: the banners bake a CTA into a bottom corner (either side), and the centre stays clear.
        <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5 md:bottom-4">
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
