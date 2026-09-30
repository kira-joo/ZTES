import type { AuthUser } from "@kira-joo/backend-toolkit-core";
import mongoose from "mongoose";

/**
 * There is exactly one admin and no admin collection. The token's `sub` is this
 * fixed id; refresh tokens reference it as their subject.
 */
export const ADMIN_SUBJECT_ID = "0000000000000000000000a1";
export const ADMIN_SUBJECT_OBJECT_ID = new mongoose.Types.ObjectId(ADMIN_SUBJECT_ID);

/**
 * Bumping ADMIN_TOKEN_VERSION invalidates every access token already issued —
 * the toolkit compares it on every request.
 */
export function adminTokenVersion(): number {
  const raw = process.env.ADMIN_TOKEN_VERSION ?? "1";
  const version = Number(raw);
  if (!Number.isInteger(version) || version < 0) {
    throw new Error(`ADMIN_TOKEN_VERSION must be a non-negative integer (got "${raw}").`);
  }
  return version;
}

export function adminUser(): AuthUser {
  return {
    _id: ADMIN_SUBJECT_ID,
    tokenVersion: adminTokenVersion(),
    // The toolkit's only full-access mechanism. Routes still declare `auth: true`.
    roles: [{ name: "admin", grantsAll: true, permissions: [] }],
    name: "Admin",
  };
}
