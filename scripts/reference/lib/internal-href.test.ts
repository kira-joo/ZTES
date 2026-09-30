// @vitest-environment node
import { describe, expect, it } from "vitest";
import { internalHref } from "./internal-href";

describe("internalHref", () => {
  it.each([
    ["https://orkidastore.com/ar/مبيدات/c1176020009", "category:1176020009"],
    ["https://orkidastore.com/en/gel/p266433170", "product:266433170"],
    ["https://orkidastore.com/ar/syngenta/brand-826671345", "brand:826671345"],
    ["https://orkidastore.com/ar/offers", "/offers"],
    ["https://orkidastore.com/en/offers/", "/offers"],
    ["https://orkidastore.com/ar/brands", "/brands"],
    ["https://orkidastore.com/en/blog", "/blog"],
    ["https://orkidastore.com/ar/تفاصيل-الشحن/page-423052245", "/تفاصيل-الشحن/page-423052245"],
    ["/ar/offers", "/offers"],
  ])("%s → %s", (input, expected) => {
    expect(internalHref(input)).toBe(expected);
  });

  it("leaves an unrelated absolute URL untouched", () => {
    expect(internalHref("https://github.com/x/y.mp4")).toBe("https://github.com/x/y.mp4");
  });

  it("returns empty for an empty input", () => {
    expect(internalHref("")).toBe("");
  });

  it("resolves a relative path against the reference host rather than throwing", () => {
    expect(internalHref("not a url at all")).toBe("/not a url at all");
  });

  it("is resilient to a genuinely unparseable value", () => {
    expect(internalHref("http://[::1")).toBe("http://[::1");
  });
});
