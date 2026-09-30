/**
 * Coerces a native number input's string value at the submit boundary.
 *
 * Toolkit form fields render through RHF's `Controller`, which never reads
 * `setValueAs` — coercion has to happen where a form actually submits
 * (`CustomForm`'s `transformValues`), not in field config. A native
 * `type="number"` input reports an empty, optional field as `""` (which
 * `CustomForm` already strips to "key absent" before `transformValues` runs),
 * so `undefined` here means "omit the field", not zero.
 */
export function toNumberOrUndefined(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/** Same, but for a field the server requires — never returns `undefined`. */
export function toNumber(value: unknown, fallback = 0): number {
  const parsed = toNumberOrUndefined(value);
  return parsed === undefined ? fallback : parsed;
}
