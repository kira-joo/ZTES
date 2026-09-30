import { formatAmount } from "src/lib/money";
import { RiyalSymbol } from "./riyal-symbol";

/** A price, with the struck-through "before" price when on sale. Money is a string. */
export function Price({
  value,
  compareAt,
  locale,
  size = "md",
}: {
  value: string;
  compareAt?: string | null;
  locale: string;
  size?: "sm" | "md" | "lg";
}) {
  const text = { sm: "text-sm", md: "text-base", lg: "text-2xl" }[size];
  const onSale = Boolean(compareAt);
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <span className={`inline-flex items-center gap-1 font-bold ${text} ${onSale ? "text-sale" : "text-ink"}`}>
        {formatAmount(value, locale)}
        <RiyalSymbol />
      </span>
      {onSale && compareAt ? (
        <span className="inline-flex items-center gap-1 text-sm text-ink-muted line-through">
          {formatAmount(compareAt, locale)}
          <RiyalSymbol />
        </span>
      ) : null}
    </span>
  );
}
