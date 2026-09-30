import type { IdempotencyRecord, IdempotencyStore } from "@kira-joo/backend-toolkit-next";
import { IdempotencyRecordModel } from "./idempotency-record.schema";

/** How long a completed record stays replayable. Well past any reasonable client retry. */
const RECORD_TTL_MS = 24 * 60 * 60 * 1000;

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
}

/**
 * The application's idempotency store, backed by MongoDB.
 *
 * **`begin` is atomic because the database makes it so**, not because of the
 * code around it. The insert either succeeds — this caller owns the key — or
 * violates the unique index on `key` and throws a duplicate-key error, which
 * means someone else got there first. There is deliberately no
 * find-then-insert: between those two statements a second request can insert,
 * and both would proceed, which is exactly the double-submit the whole
 * mechanism exists to prevent.
 */
export const mongoIdempotencyStore: IdempotencyStore = {
  async begin(key, requestHash) {
    try {
      await IdempotencyRecordModel.create({
        key,
        requestHash,
        expiresAt: new Date(Date.now() + RECORD_TTL_MS),
      });
      return { claimed: true };
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;

      const existing = await IdempotencyRecordModel.findOne({ key }).lean();

      /*
       * Vanishingly rare, but real: the record can expire between the failed
       * insert and this read. Reporting "claimed by someone else, no record"
       * yields a 409, and the client's retry then succeeds — strictly better
       * than reporting success for work that never ran.
       */
      if (!existing) return { claimed: false };

      // `status` is only written on completion, so its absence means the
      // original request is still in flight.
      const record: IdempotencyRecord | undefined =
        existing.status === undefined
          ? undefined
          : { status: existing.status, body: existing.body, requestHash: existing.requestHash };

      return { claimed: false, record };
    }
  },

  async complete(key, record) {
    await IdempotencyRecordModel.updateOne(
      { key },
      { $set: { status: record.status, body: record.body, requestHash: record.requestHash } }
    );
  },

  async release(key) {
    // Deleted rather than marked failed: only a success is worth replaying, and
    // a client retrying after a 500 must be able to genuinely retry.
    await IdempotencyRecordModel.deleteOne({ key });
  },
};
