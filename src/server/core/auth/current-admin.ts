import "server-only";
import { verifyAuthToken } from "@kira-joo/backend-toolkit-next";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE } from "./admin-cookies";
import { adminJwtConfig } from "./admin-jwt";
import { resolveAdminUser } from "./resolve-admin-user";

/** For Server Components under /admin. UX only — every admin API route enforces auth itself. */
export async function isAdminSignedIn(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return false;
  try {
    const payload = await verifyAuthToken(token, adminJwtConfig());
    const user = payload.sub ? await resolveAdminUser(payload.sub) : null;
    return Boolean(user && user.tokenVersion === payload.tokenVersion);
  } catch {
    return false;
  }
}
