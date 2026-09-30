// @vitest-environment node
import { describe, expect, it } from "vitest";
import { normalizeEmail, normalizeSaudiMobile, normalizeSearchText, slugify } from "./normalize";

describe("normalizeSaudiMobile", () => {
  it.each([
    ["0563033126", "+966563033126"],
    ["563033126", "+966563033126"],
    ["966563033126", "+966563033126"],
    ["+966 56 303 3126", "+966563033126"],
    ["00966563033126", "+966563033126"],
    ["٠٥٦٣٠٣٣١٢٦", "+966563033126"],
    ["056-303-3126", "+966563033126"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeSaudiMobile(input)).toBe(expected);
  });

  it.each(["0112345678", "+201001234567", "05630331", "abc", ""])("rejects %s", (input) => {
    expect(normalizeSaudiMobile(input)).toBeNull();
  });
});

describe("normalizeEmail", () => {
  it("trims and lower-cases", () => expect(normalizeEmail("  Info@OrkidaStore.com ")).toBe("info@orkidastore.com"));
});

describe("normalizeSearchText", () => {
  it("folds hamza, taa marbuta and alef maqsura", () => {
    expect(normalizeSearchText("أسطوانة")).toBe(normalizeSearchText("اسطوانه"));
    expect(normalizeSearchText("مُبِيد")).toBe("مبيد");
    expect(normalizeSearchText("على")).toBe("علي");
  });

  it("lower-cases Latin and collapses punctuation", () => {
    expect(normalizeSearchText("Advion  Gel–30g")).toBe("advion gel 30g");
  });
});

describe("slugify", () => {
  it("keeps Arabic letters", () => expect(slugify("جل ادفيون")).toBe("جل-ادفيون"));
  it("lower-cases Latin and trims hyphens", () => expect(slugify(" Gel Advion 30g! ")).toBe("gel-advion-30g"));
  it("drops diacritics", () => expect(slugify("مُبِيد")).toBe("مبيد"));
});
