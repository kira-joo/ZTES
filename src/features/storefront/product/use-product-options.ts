"use client";

import { roundMoney, sum } from "@kira-joo/toolkit-common";
import { useMemo, useState } from "react";
import type { ProductDetailView } from "src/common/types/storefront";

export interface QuantityTierHint {
  currentPercent: number;
  next: { minQuantity: number; percent: number } | null;
}

/**
 * Option selection, live price recomputation and quantity for a product —
 * shared by the product page and the quick-view dialog so both stay in sync
 * with the same rules: a required group must have a value selected before
 * add-to-cart is enabled, an unavailable value can be seen but not chosen,
 * and the shown price/compare-at price track every selected option's
 * `priceDelta` (rounded once, at display time — never accumulated as a float).
 *
 * CONTRACT: `useProductOptions(product)` — keep this signature stable, the
 * product page and quick view both depend on it.
 */
export function useProductOptions(product: ProductDetailView) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  const select = (groupId: string, valueId: string) => setSelected((prev) => ({ ...prev, [groupId]: valueId }));

  const selectedValues = useMemo(
    () =>
      product.options
        .map((group) => {
          const valueId = selected[group._id];
          const value = valueId ? group.values.find((candidate) => candidate._id === valueId) : undefined;
          return value ? { group, value } : null;
        })
        .filter((entry): entry is { group: ProductDetailView["options"][number]; value: ProductDetailView["options"][number]["values"][number] } => entry !== null),
    [product.options, selected]
  );

  const missingRequiredGroupIds = useMemo(
    () => product.options.filter((group) => group.required && !selected[group._id]).map((group) => group._id),
    [product.options, selected]
  );

  const hasUnavailableSelection = selectedValues.some((entry) => !entry.value.isAvailable);
  const canAddToCart = missingRequiredGroupIds.length === 0 && !hasUnavailableSelection && product.inStock;

  const deltaSum = useMemo(() => sum(selectedValues.map((entry) => entry.value.priceDelta)), [selectedValues]);
  const unitPrice = useMemo(() => roundMoney(sum([product.price, deltaSum])).toFixed(2), [product.price, deltaSum]);
  const compareAtPrice = useMemo(
    () => (product.compareAtPrice ? roundMoney(sum([product.compareAtPrice, deltaSum])).toFixed(2) : null),
    [product.compareAtPrice, deltaSum]
  );

  const maxQuantity = product.trackStock ? Math.max(1, Math.min(99, product.stock)) : 99;
  const setBoundedQuantity = (next: number) => setQuantity(Math.max(1, Math.min(maxQuantity, Math.round(next))));

  const tierHint = useMemo<QuantityTierHint>(() => {
    const tiers = [...product.quantityTiers].sort((a, b) => a.minQuantity - b.minQuantity);
    const applicable = [...tiers].reverse().find((tier) => quantity >= tier.minQuantity);
    const next = tiers.find((tier) => tier.minQuantity > quantity) ?? null;
    return { currentPercent: applicable?.percent ?? 0, next };
  }, [product.quantityTiers, quantity]);

  return {
    selected,
    select,
    selectedValues,
    missingRequiredGroupIds,
    canAddToCart,
    unitPrice,
    compareAtPrice,
    quantity,
    setQuantity: setBoundedQuantity,
    maxQuantity,
    tierHint,
    optionValueIds: selectedValues.map((entry) => entry.value._id),
  };
}
