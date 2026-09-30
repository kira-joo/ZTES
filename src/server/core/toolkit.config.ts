import { configureNextBackendToolkit } from "@kira-joo/backend-toolkit-next";
import { DateTimeConfig } from "@kira-joo/toolkit-common";
import { STORE_TIMEZONE } from "src/common/config/store";
import { ADMIN_SESSION_COOKIE } from "./auth/admin-cookies";
import { adminJwtConfig } from "./auth/admin-jwt";
import { resolveAdminUser } from "./auth/resolve-admin-user";
import { connectToDatabase } from "./db/connect";
import { mongoIdempotencyStore } from "./idempotency/mongo-idempotency-store";
import { publishRevalidation } from "./revalidation/publish-revalidation";

let configured = false;

/** The single global toolkit configuration. Idempotent; called from instrumentation and route-factories. */
export function configureToolkit(): void {
  if (configured) return;

  // Order numbers and any calendar-day logic resolve in the store's zone, not the server's.
  DateTimeConfig.timeZone = STORE_TIMEZONE;

  configureNextBackendToolkit({
    database: { connect: connectToDatabase },
    jwt: adminJwtConfig(),
    auth: {
      resolveUser: resolveAdminUser,
      // An httpOnly cookie: readable by Server Components and the proxy, never by page script.
      tokenSource: "cookie",
      cookieName: ADMIN_SESSION_COOKIE,
    },
    idempotency: { store: mongoIdempotencyStore },
    // Without this key every `revalidateTags` declaration is silently inert.
    cache: { publishRevalidation },
  });

  configured = true;
}
