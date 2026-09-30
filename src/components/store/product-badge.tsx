import type { ProductBadgeView } from "src/common/types/storefront";
import { pickLocalized } from "src/lib/localized";

const TONES: Record<string, string> = {
  PRIMARY: "bg-brand text-white",
  SALE: "bg-sale text-white",
  NEUTRAL: "bg-band text-ink",
  DARK: "bg-brand-deep text-white",
};

export function ProductBadge({ badge, locale }: { badge: ProductBadgeView; locale: string }) {
  const label = pickLocalized(badge.label, locale);
  if (!label) return null;
  return <span className={`rounded-full px-2.5 py-1 text-[0.7rem] font-semibold ${TONES[badge.tone] ?? TONES.PRIMARY}`}>{label}</span>;
}
