import type { LocalizedString } from "@kira-joo/toolkit-common";
import { normalizeSearchText } from "src/server/engines/normalize";

/** The normalised text a product is searched by. Recomputed on every product write. */
export function buildProductSearchText(input: {
  name: LocalizedString;
  sku?: string | null;
  brandName?: LocalizedString | null;
}): string {
  return normalizeSearchText(
    [input.name.ar, input.name.en, input.sku ?? "", input.brandName?.ar ?? "", input.brandName?.en ?? ""].join(" ")
  );
}
