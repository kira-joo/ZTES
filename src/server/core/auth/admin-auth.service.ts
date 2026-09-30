import { UnauthorizedError } from "@kira-joo/backend-toolkit-core";
import { issueRefreshToken, revokeToken, rotateRefreshToken } from "@kira-joo/backend-toolkit-mongoose";
import { comparePassword, hashPassword, signAuthToken } from "@kira-joo/backend-toolkit-next";
import { ADMIN_SUBJECT_ID, ADMIN_SUBJECT_OBJECT_ID, adminTokenVersion } from "./admin-identity";
import { adminRefreshTtlMs } from "./admin-cookies";
import { adminJwtConfig } from "./admin-jwt";
import { AdminRefreshTokenModel } from "./admin-refresh-token.schema";

const MIN_PASSWORD_LENGTH = 12;

export interface AdminSession {
  accessToken: string;
  refreshToken: string;
}

/**
 * The configured password, hashed once per process. Comparing through the
 * hasher keeps the check constant-time (scrypt + timingSafeEqual) instead of a
 * `===` on the plaintext, which leaks the matching prefix length.
 */
let passwordHashPromise: Promise<string> | undefined;

export function assertAdminPasswordConfigured(): void {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`ADMIN_PASSWORD must be set to at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
}

function adminPasswordHash(): Promise<string> {
  assertAdminPasswordConfigured();
  passwordHashPromise ??= hashPassword(process.env.ADMIN_PASSWORD!);
  return passwordHashPromise;
}

async function issueAccessToken(): Promise<string> {
  return signAuthToken({ sub: ADMIN_SUBJECT_ID, tokenVersion: adminTokenVersion() }, undefined, adminJwtConfig());
}

export async function loginAdmin(password: string): Promise<AdminSession> {
  const matches = await comparePassword(password, await adminPasswordHash());
  // One message for every failure.
  if (!matches) throw new UnauthorizedError("Incorrect password.");

  const refresh = await issueRefreshToken({
    model: AdminRefreshTokenModel,
    subjectId: ADMIN_SUBJECT_OBJECT_ID,
    ttlMs: adminRefreshTtlMs(),
  });

  return { accessToken: await issueAccessToken(), refreshToken: refresh.token };
}

/**
 * Rotation with reuse detection: presenting an already-rotated token revokes
 * the whole family. Every failure is the same bare UnauthorizedError.
 */
export async function refreshAdminSession(presentedToken: string | undefined): Promise<AdminSession> {
  if (!presentedToken) throw new UnauthorizedError();
  const rotated = await rotateRefreshToken(AdminRefreshTokenModel, presentedToken, adminRefreshTtlMs());
  if (String(rotated.subjectId) !== ADMIN_SUBJECT_ID) throw new UnauthorizedError();
  return { accessToken: await issueAccessToken(), refreshToken: rotated.issued.token };
}

export async function logoutAdmin(presentedToken: string | undefined): Promise<void> {
  if (!presentedToken) return;
  await revokeToken(AdminRefreshTokenModel, presentedToken).catch(() => undefined);
}
