import { MongoField, MongoSchema, Unique, createMongoModel } from "@kira-joo/backend-toolkit-mongoose";
import mongoose from "mongoose";
import { EntityName } from "src/common/enums";

/**
 * One row per `Idempotency-Key`. Atomicity comes from the unique index: the
 * losing insert of a race is rejected, which a read-then-write cannot achieve.
 */
@MongoSchema({ timestamps: true, collection: "idempotency_records" })
export class IdempotencyRecordSchema {
  _id!: mongoose.Types.ObjectId;

  @Unique()
  @MongoField({ type: String, required: true })
  key!: string;

  /** Fingerprint of the original request, so a key replayed with different content is caught. */
  @MongoField({ type: String, required: true })
  requestHash!: string;

  /** Absent while the original request is still in flight. */
  @MongoField({ type: Number, required: false })
  status?: number;

  @MongoField({ type: mongoose.Schema.Types.Mixed, required: false })
  body?: unknown;

  @MongoField({ type: Date, required: true, expires: 0 })
  expiresAt!: Date;
}

export const IdempotencyRecordModel = createMongoModel(EntityName.IDEMPOTENCY_RECORD, IdempotencyRecordSchema);
