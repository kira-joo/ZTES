"use client";

import { Minus, Plus } from "lucide-react";

/**
 * A bounded +/- quantity control. Shared by the product page, quick view and
 * the cart line item.
 *
 * CONTRACT: `<QuantityStepper value onChange min? max? size? labels />`.
 */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  labels,
  disabled = false,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  labels: { decrease: string; increase: string };
  disabled?: boolean;
}) {
  const box = size === "sm" ? "size-8" : "size-10";
  const text = size === "sm" ? "text-sm" : "text-base";
  return (
    <div className={`inline-flex items-center overflow-hidden rounded-card border border-line ${disabled ? "opacity-60" : ""}`}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= min}
        aria-label={labels.decrease}
        className={`grid ${box} place-items-center text-ink transition hover:bg-canvas disabled:pointer-events-none disabled:opacity-40`}
      >
        <Minus className="size-3.5" aria-hidden="true" />
      </button>
      <span className={`grid ${box} place-items-center ${text} font-semibold tabular-nums text-ink`} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label={labels.increase}
        className={`grid ${box} place-items-center text-ink transition hover:bg-canvas disabled:pointer-events-none disabled:opacity-40`}
      >
        <Plus className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
