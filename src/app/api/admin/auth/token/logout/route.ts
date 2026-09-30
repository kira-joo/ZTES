import { cookies } from "next/headers";
import { logoutAdmin } from "src/server/core/auth/admin-auth.service";
import { ADMIN_REFRESH_COOKIE, eraseAdminSession } from "src/server/core/auth/admin-cookies";
import { createPostRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

/** Revokes the refresh family server-side, then clears both cookies with their original paths. */
export const POST = createPostRoute({
  auth: false,
  successStatus: 200,
  handler: async () => {
    await logoutAdmin((await cookies()).get(ADMIN_REFRESH_COOKIE)?.value);
    await eraseAdminSession();
    return { signedOut: true };
  },
});
