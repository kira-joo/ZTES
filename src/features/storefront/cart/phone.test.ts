// @vitest-environment node
import { describe, expect, it } from "vitest";
import { SAUDI_LOCAL_MOBILE, stripSaudiPrefix, toE164SaudiPhone } from "./phone";

describe("toE164SaudiPhone", () => {
  it("prefixes the local part with +966", () => {
    expect(toE164SaudiPhone("512345678")).toBe("+966512345678");
  });
});

describe("stripSaudiPrefix", () => {
  it("removes a leading +966", () => {
    expect(stripSaudiPrefix("+966512345678")).toBe("512345678");
  });

  it("removes a leading 966 with no plus", () => {
    expect(stripSaudiPrefix("966512345678")).toBe("512345678");
  });

  it("round-trips through toE164SaudiPhone and back", () => {
    const local = "512345678";
    expect(stripSaudiPrefix(toE164SaudiPhone(local))).toBe(local);
  });

  it("leaves an already-local number untouched", () => {
    expect(stripSaudiPrefix("512345678")).toBe("512345678");
  });
});

describe("SAUDI_LOCAL_MOBILE", () => {
  it("accepts a 9-digit local part starting with 5", () => {
    expect(SAUDI_LOCAL_MOBILE.test("512345678")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(SAUDI_LOCAL_MOBILE.test("412345678")).toBe(false);
    expect(SAUDI_LOCAL_MOBILE.test("51234567")).toBe(false);
    expect(SAUDI_LOCAL_MOBILE.test("+966512345678")).toBe(false);
  });
});
