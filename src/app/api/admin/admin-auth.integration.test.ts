// @vitest-environment node
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { signAuthToken } from "@kira-joo/backend-toolkit-next";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ADMIN_SUBJECT_ID } from "src/server/core/auth/admin-identity";
import { ADMIN_REFRESH_COOKIE, ADMIN_SESSION_COOKIE } from "src/server/core/auth/admin-cookies";
import { adminJwtConfig } from "src/server/core/auth/admin-jwt";
import { cookieJar } from "src/test/cookie-jar";
import { setupTestDatabase } from "src/test/mongo";

vi.mock("next/headers", async () => (await import("src/test/cookie-jar")).mockHeadersModule);
vi.mock("next/cache", () => ({ revalidateTag: vi.fn(), unstable_cache: (fn: () => unknown) => fn }));

setupTestDatabase();

const ADMIN_DIR = path.resolve(__dirname);
/** Routes that are deliberately reachable without a session, and why. */
const PUBLIC = new Set(["auth/login", "auth/token/refresh", "auth/token/logout"]);

function routeFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) routeFiles(full, found);
    else if (entry === "route.ts") found.push(full);
  }
  return found;
}

const PARAMS = { id: "0000000000000000000000b1", orderNumber: "260930-0001", lineId: "0000000000000000000000b2" };

async function call(file: string, method: string, cookie?: string) {
  const mod = (await import(file)) as Record<string, (req: NextRequest, ctx: unknown) => Promise<Response>>;
  const request = new NextRequest("http://localhost/api/admin/x", {
    method,
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    ...(method === "GET" || method === "DELETE" ? {} : { body: "{}" }),
  });
  return mod[method]!(request, { params: Promise.resolve(PARAMS) });
}

beforeEach(() => cookieJar.clear());

describe("admin authentication", () => {
  const files = routeFiles(ADMIN_DIR);

  it("finds the admin routes, so the sweep cannot pass vacuously", () => {
    // Admin manages only Products, Categories, Coupons, Orders (plus auth,
    // dashboard, and a read-only brands list) — see docs/implementation-plan.md's
    // "Scope correction". This floor is intentionally below the current count.
    expect(files.length).toBeGreaterThan(15);
  });

  it("rejects every protected handler without a session (401)", async () => {
    const failures: string[] = [];
    let checked = 0;
    for (const file of files) {
      const route = path.relative(ADMIN_DIR, path.dirname(file));
      if (PUBLIC.has(route)) continue;
      const mod = await import(file);
      for (const method of ["GET", "POST", "PUT", "DELETE"].filter((m) => typeof mod[m] === "function")) {
        checked += 1;
        const response = await call(file, method);
        if (response.status !== 401) failures.push(`${method} ${route} → ${response.status}`);
      }
    }
    expect(checked).toBeGreaterThan(20);
    expect(failures).toEqual([]);
  });

  it("rejects a token from before ADMIN_TOKEN_VERSION was bumped, and a forged subject", async () => {
    const me = path.join(ADMIN_DIR, "auth/me/route.ts");
    const stale = await signAuthToken({ sub: ADMIN_SUBJECT_ID, tokenVersion: 0 }, undefined, adminJwtConfig());
    expect((await call(me, "GET", `${ADMIN_SESSION_COOKIE}=${stale}`)).status).toBe(401);

    const other = await signAuthToken({ sub: "0000000000000000000000ff", tokenVersion: 1 }, undefined, adminJwtConfig());
    expect((await call(me, "GET", `${ADMIN_SESSION_COOKIE}=${other}`)).status).toBe(401);

    const valid = await signAuthToken({ sub: ADMIN_SUBJECT_ID, tokenVersion: 1 }, undefined, adminJwtConfig());
    expect((await call(me, "GET", `${ADMIN_SESSION_COOKIE}=${valid}`)).status).toBe(200);
  });

  it("logs in only with the configured password, with one message for every failure", async () => {
    const { POST } = await import("./auth/login/route");
    const login = (password: string) =>
      POST(
        new NextRequest("http://localhost/api/admin/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${password.length}` },
          body: JSON.stringify({ password }),
        }),
        { params: Promise.resolve({}) } as never
      );

    const wrong = await login("not-the-password");
    expect(wrong.status).toBe(401);
    expect((await wrong.json()).message).toBe("Incorrect password.");
    expect(cookieJar.has(ADMIN_SESSION_COOKIE)).toBe(false);

    const right = await login(process.env.ADMIN_PASSWORD!);
    expect(right.status).toBe(200);
    expect(cookieJar.has(ADMIN_SESSION_COOKIE)).toBe(true);
    expect(cookieJar.values.get(ADMIN_REFRESH_COOKIE)?.options?.path).toBe("/api/admin/auth/token");
    expect(cookieJar.values.get(ADMIN_SESSION_COOKIE)?.options?.httpOnly).toBe(true);
  });

  it("rotates the refresh token and revokes the whole family on reuse", async () => {
    const { loginAdmin, refreshAdminSession } = await import("src/server/core/auth/admin-auth.service");
    const first = await loginAdmin(process.env.ADMIN_PASSWORD!);
    const second = await refreshAdminSession(first.refreshToken);
    expect(second.refreshToken).not.toBe(first.refreshToken);

    // Presenting the already-rotated token is reuse: refused, and the newer one dies with it.
    await expect(refreshAdminSession(first.refreshToken)).rejects.toMatchObject({ statusCode: 401 });
    await expect(refreshAdminSession(second.refreshToken)).rejects.toMatchObject({ statusCode: 401 });
    await expect(refreshAdminSession("never-issued")).rejects.toMatchObject({ statusCode: 401 });
  });
});
