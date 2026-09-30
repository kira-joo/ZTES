import { MongoField, MongoSchema, Searchable, Unique, createMongoModel } from "@kira-joo/backend-toolkit-mongoose";
import mongoose from "mongoose";
import { EntityName } from "src/common/enums";
import { addressSnapshotSchema, type AddressSnapshot } from "./order-snapshots";

/**
 * A guest buyer. Phone and email are each unique: the unique indexes are what
 * make two concurrent first orders converge on one record.
 */
@MongoSchema({ timestamps: true })
export class CustomerSchema {
  _id!: mongoose.Types.ObjectId;

  @Searchable()
  @MongoField({ type: String, required: true, trim: true })
  firstName!: string;

  @Searchable()
  @MongoField({ type: String, required: true, trim: true })
  lastName!: string;

  /** E.164, `+9665XXXXXXXX`. */
  @Unique({ message: "A customer with this phone number already exists." })
  @Searchable()
  @MongoField({ type: String, required: true })
  phone!: string;

  @Unique({ message: "A customer with this email already exists." })
  @Searchable()
  @MongoField({ type: String, required: true, lowercase: true, trim: true })
  email!: string;

  @MongoField({ type: addressSnapshotSchema, default: null })
  lastAddress?: AddressSnapshot | null;

  @MongoField({ type: Number, default: 0 })
  orderCount!: number;

  @MongoField({ type: Date, default: null })
  lastOrderAt?: Date | null;
}

export const CustomerModel = createMongoModel(EntityName.CUSTOMER, CustomerSchema);
