import { MONEY_SCALE } from "@kira-joo/toolkit-common";
import { Decimal } from "decimal.js";
import mongoose from "mongoose";

/**
 * Converts a repository result into JSON-safe data: Decimal money becomes a
 * fixed-scale string (never a float), ObjectIds become strings, Dates ISO
 * strings.
 *
 * Route responses and cached storefront reads both pass through this, because
 * `unstable_cache` serialises with JSON and would otherwise turn a Decimal into
 * `{}` and an ObjectId into an opaque object.
 */
export function toPlain<T>(value: T): T {
  return walk(value) as T;
}

function walk(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Decimal.isDecimal(value)) return (value as Decimal).toFixed(MONEY_SCALE);
  if (value instanceof mongoose.Types.ObjectId) return value.toHexString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(walk);
  if (typeof value !== "object") return value;

  const maybeDoc = value as { toObject?: () => unknown; _bsontype?: string };
  if (maybeDoc._bsontype === "Decimal128") return new Decimal(String(value)).toFixed(MONEY_SCALE);
  if (typeof maybeDoc.toObject === "function" && value instanceof mongoose.Document) {
    return walk(value.toObject({ getters: true }));
  }

  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (key === "__v") continue;
    result[key] = walk(item);
  }
  return result;
}
