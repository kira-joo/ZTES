import { Star } from "lucide-react";

/**
 * The reference's single-star rating pill: one filled star plus the numeric
 * average (never a five-star row). `count` renders the review count in
 * parentheses when the card/page has room for it.
 */
export function RatingStars({
  value,
  count,
  size = "sm",
  className = "",
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const text = size === "sm" ? "text-xs" : "text-sm";
  const icon = size === "sm" ? "size-3.5" : "size-4";
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return (
    <span className={`inline-flex items-center gap-1 font-semibold text-ink ${text} ${className}`}>
      <Star className={`${icon} fill-star text-star`} aria-hidden="true" />
      <span>{formatted}</span>
      {typeof count === "number" && count > 0 ? <span className="font-normal text-ink-muted">({count})</span> : null}
    </span>
  );
}
