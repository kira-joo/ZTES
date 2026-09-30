/**
 * A product's displayed rating: the imported baseline combined with the
 * published reviews written since. Imported reviews are excluded from `ratings`
 * because the baseline already counts them.
 */
export function combineRating(
  baseline: { average: number; count: number },
  ratings: readonly number[]
): { average: number; count: number } {
  const count = baseline.count + ratings.length;
  if (count === 0) return { average: 0, count: 0 };
  const total = baseline.average * baseline.count + ratings.reduce((acc, rating) => acc + rating, 0);
  return { average: Math.round((total / count) * 100) / 100, count };
}
