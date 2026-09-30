import { eraseTokenCookie, writeTokenCookie } from "@kira-joo/backend-toolkit-next";
import { readDurationMs } from "src/server/core/config/env";

export const ADMIN_SESSION_COOKIE = "ztes_admin_session";
export const ADMIN_REFRESH_COOKIE = "ztes_admin_refresh";

const SESSION_COOKIE_PATH = "/";

/**
 * The refresh cookie is sent only to the refresh and logout routes, which live
 * beneath this prefix. Widening it to `/` so a sibling route could read it is
 * the trade that once made a logout revoke nothing while returning 200.
 */
export const REFRESH_COOKIE_PATH = "/api/admin/auth/token";

export function adminAccessTtlMs(): number {
  return readDurationMs("ADMIN_ACCESS_TOKEN_TTL", "15m");
}

export function adminRefreshTtlMs(): number {
  return readDurationMs("ADMIN_REFRESH_TOKEN_TTL", "7d");
}

export async function writeAdminSession(session: { accessToken: string; refreshToken: string }): Promise<void> {
  await writeTokenCookie(session.accessToken, {
    name: ADMIN_SESSION_COOKIE,
    path: SESSION_COOKIE_PATH,
    maxAge: Math.floor(adminAccessTtlMs() / 1000),
  });
  await writeTokenCookie(session.refreshToken, {
    name: ADMIN_REFRESH_COOKIE,
    path: REFRESH_COOKIE_PATH,
    maxAge: Math.floor(adminRefreshTtlMs() / 1000),
  });
}

/** Clearing re-sends the same path, or the browser keeps the cookie. */
export async function eraseAdminSession(): Promise<void> {
  await eraseTokenCookie({ name: ADMIN_SESSION_COOKIE, path: SESSION_COOKIE_PATH });
  await eraseTokenCookie({ name: ADMIN_REFRESH_COOKIE, path: REFRESH_COOKIE_PATH });
}
