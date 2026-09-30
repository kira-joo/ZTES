// @vitest-environment node
import { describe, expect, it } from "vitest";
import { OrderStatus } from "src/common/enums";
import { allowedTransitions, canTransition } from "./order-state";

describe("order state", () => {
  it("walks the happy path", () => {
    expect(canTransition(OrderStatus.PLACED, OrderStatus.CONFIRMED)).toBe(true);
    expect(canTransition(OrderStatus.CONFIRMED, OrderStatus.OUT_FOR_DELIVERY)).toBe(true);
    expect(canTransition(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED)).toBe(true);
  });
  it("never skips or reverses", () => {
    expect(canTransition(OrderStatus.PLACED, OrderStatus.DELIVERED)).toBe(false);
    expect(canTransition(OrderStatus.CONFIRMED, OrderStatus.PLACED)).toBe(false);
  });
  it("treats delivered and cancelled as terminal", () => {
    expect(allowedTransitions(OrderStatus.DELIVERED)).toEqual([]);
    expect(allowedTransitions(OrderStatus.CANCELLED)).toEqual([]);
  });
});
