import { describe, expect, it } from "vitest";
import { toNumber, toNumberOrUndefined } from "./form-number";

describe("toNumberOrUndefined", () => {
  it("parses a numeric string", () => {
    expect(toNumberOrUndefined("42")).toBe(42);
    expect(toNumberOrUndefined("3.5")).toBe(3.5);
  });

  it("treats empty, null and undefined as absent", () => {
    expect(toNumberOrUndefined("")).toBeUndefined();
    expect(toNumberOrUndefined(null)).toBeUndefined();
    expect(toNumberOrUndefined(undefined)).toBeUndefined();
  });

  it("treats a non-numeric string as absent rather than throwing", () => {
    expect(toNumberOrUndefined("abc")).toBeUndefined();
  });
});

describe("toNumber", () => {
  it("falls back when the value is absent", () => {
    expect(toNumber("", 7)).toBe(7);
    expect(toNumber(undefined)).toBe(0);
  });

  it("parses a present value", () => {
    expect(toNumber("12")).toBe(12);
  });
});
