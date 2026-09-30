import { toMoney, type Money } from "@kira-joo/toolkit-common";
import { Decimal } from "decimal.js";

/**
 * Money read back from a raw `Model.find().lean()`. The repository layer
 * revives Decimal128 on lean reads; a raw model call does not, and `toMoney`
 * rightly refuses a BSON object. Every raw read of a money field goes through
 * this, never `Number(...)`.
 */
export function readMoney(value: unknown): Money {
  if (value === null || value === undefined) return toMoney(0);
  if (Decimal.isDecimal(value)) return value as Money;
  if (typeof value === "object" && (value as { _bsontype?: string })._bsontype === "Decimal128") {
    return toMoney(String(value));
  }
  return toMoney(value as string | number);
}

export function readOptionalMoney(value: unknown): Money | null {
  return value === null || value === undefined ? null : readMoney(value);
}
