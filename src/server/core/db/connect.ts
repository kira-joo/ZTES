import mongoose from "mongoose";
import { ensureIndexes } from "./ensure-indexes";

/**
 * The connection is memoised on `globalThis`: Next's dev hot reload discards
 * the module registry, and a module-level cache would open a new pool on every
 * edit. Concurrent cold-start callers share the one in-flight promise.
 */
interface MongooseCache {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalWithMongoose = globalThis as typeof globalThis & { __ztesMongoose?: MongooseCache };
const cache: MongooseCache = (globalWithMongoose.__ztesMongoose ??= { connection: null, promise: null });

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cache.connection) return cache.connection;

  if (!cache.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error(
        "MONGODB_URI is not set. Copy .env.example to .env and point it at a MongoDB REPLICA SET " +
          "(`docker compose up -d` starts one). Order placement is a transaction and needs it."
      );
    }

    cache.promise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 8_000, dbName: process.env.MONGODB_DB || "ztes" })
      // Uniqueness here IS the index (idempotency, customer phone/email, order
      // numbers), so no request runs until every declared index exists.
      .then(async (connection) => {
        const { ALL_MODELS } = await import("./model-registry");
        await ensureIndexes(ALL_MODELS);
        return connection;
      })
      .catch((error: unknown) => {
        cache.promise = null;
        throw error;
      });
  }

  cache.connection = await cache.promise;
  return cache.connection;
}
