// @vitest-environment node
import { describe, expect, it } from "vitest";
import { formatOrderNumber, orderDayKey } from "./order-number";

describe("order numbers", () => {
  it("dates by the Riyadh day, not UTC", () => {
    // 22:30 UTC on the 30th is 01:30 on the 1st in Riyadh (UTC+3).
    expect(orderDayKey(new Date("2026-09-30T22:30:00Z"))).toBe("261001");
    expect(orderDayKey(new Date("2026-09-30T20:59:00Z"))).toBe("260930");
  });

  it("pads to four digits and never truncates", () => {
    expect(formatOrderNumber(7, "260930")).toBe("260930-0007");
    expect(formatOrderNumber(12345, "260930")).toBe("260930-12345");
    expect(() => formatOrderNumber(0, "260930")).toThrow();
  });
});
