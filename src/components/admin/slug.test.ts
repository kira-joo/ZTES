import { describe, expect, it } from "vitest";
import { slugifyEnglish, slugifyLocalized } from "./slug";

const EN_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LOCALIZED_SLUG_PATTERN = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;

describe("slugifyEnglish", () => {
  it("lowercases and hyphenates", () => {
    expect(slugifyEnglish("Omega 3 Fish Oil")).toBe("omega-3-fish-oil");
  });

  it("collapses repeated separators and trims edges", () => {
    expect(slugifyEnglish("  Vitamin C -- 1000mg!! ")).toBe("vitamin-c-1000mg");
  });

  it("strips Latin diacritics instead of dropping the letter", () => {
    expect(slugifyEnglish("Café Crème")).toBe("cafe-creme");
  });

  it("always satisfies the server's English slug pattern", () => {
    for (const input of ["Product #1 (New!)", "  ", "A/B Test", "100% Pure"]) {
      const slug = slugifyEnglish(input);
      if (slug.length > 0) expect(slug).toMatch(EN_SLUG_PATTERN);
    }
  });
});

describe("slugifyLocalized", () => {
  it("keeps Arabic letters and hyphenates the rest", () => {
    expect(slugifyLocalized("زيت السمك أوميغا 3")).toBe("زيت-السمك-أوميغا-3");
  });

  it("collapses repeated separators and trims edges", () => {
    expect(slugifyLocalized("  فيتامين -- سي! ")).toBe("فيتامين-سي");
  });

  it("always satisfies the server's localized slug pattern", () => {
    for (const input of ["منتج #1", "  ", "أ/ب اختبار"]) {
      const slug = slugifyLocalized(input);
      if (slug.length > 0) expect(slug).toMatch(LOCALIZED_SLUG_PATTERN);
    }
  });
});
