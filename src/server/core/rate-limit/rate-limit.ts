import { AppError } from "@kira-joo/backend-toolkit-core";
import mongoose from "mongoose";

const rateLimitSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, required: true, default: 0 },
    /** TTL anchor. Mongo removes the document once the window closes, so nothing accumulates. */
    expiresAt: { type: Date, required: true },
  },
  { collection: "rate_limits", versionKey: false }
);

rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RateLimitModel =
  (mongoose.models.RateLimit as mongoose.Model<{ key: string; count: number; expiresAt: Date }>) ??
  mongoose.model("RateLimit", rateLimitSchema);

export class RateLimitExceededError extends AppError {
  readonly statusCode = 429;
  readonly code = "RATE_LIMIT_EXCEEDED";

  constructor(
    /** Seconds until the window resets. Surfaced so the client can wait rather than hammer. */
    public readonly retryAfterSeconds: number,
    message = "Too many attempts. Please wait and try again."
  ) {
    super(message, { retryAfterSeconds });
  }
}

export interface RateLimitOptions {
  /** Namespaced by caller, e.g. `login:203.0.113.4`. */
  key: string;
  maxAttempts: number;
  windowMs: number;
}

export async function enforceRateLimit(options: RateLimitOptions): Promise<void> {
  const { key, maxAttempts, windowMs } = options;
  const now = Date.now();

  const record = await RateLimitModel.findOneAndUpdate(
    { key },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date(now + windowMs) },
    },
    { upsert: true, returnDocument: "after" }
  ).lean();

  if (!record) return;

  if (record.count > maxAttempts) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.expiresAt.getTime() - now) / 1000));
    throw new RateLimitExceededError(retryAfterSeconds);
  }
}

export async function clearRateLimit(key: string): Promise<void> {
  await RateLimitModel.deleteOne({ key });
}

export function resolveClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";

  return request.headers.get("x-real-ip") ?? "unknown";
}

export const RATE_LIMITS = {
  LOGIN: { maxAttempts: 8, windowMs: 15 * 60_000 },
  COUPON: { maxAttempts: 30, windowMs: 10 * 60_000 },
  ORDER_PLACEMENT: { maxAttempts: 20, windowMs: 10 * 60_000 },
  REVIEW: { maxAttempts: 10, windowMs: 60 * 60_000 },
  NEWSLETTER: { maxAttempts: 10, windowMs: 60 * 60_000 },
} as const;
