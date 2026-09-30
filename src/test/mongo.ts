import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach } from "vitest";

/**
 * A real single-node replica set per test file — transactions do not run on a
 * standalone node, and order placement is a transaction.
 */
export function setupTestDatabase(): void {
  let replSet: MongoMemoryReplSet;

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
    const uri = replSet.getUri();
    process.env.MONGODB_URI = uri;
    process.env.MONGODB_DB = "ztes-test";
    const { connectToDatabase } = await import("src/server/core/db/connect");
    await connectToDatabase();
  });

  beforeEach(async () => {
    const collections = await mongoose.connection.db!.collections();
    await Promise.all(collections.map((collection) => collection.deleteMany({})));
  });

  afterAll(async () => {
    await mongoose.disconnect();
    (globalThis as { __ztesMongoose?: unknown }).__ztesMongoose = undefined;
    await replSet?.stop();
  });
}
