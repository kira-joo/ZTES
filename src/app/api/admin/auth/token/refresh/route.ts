import { cookies } from "next/headers";
import { refreshAdminSession } from "src/server/core/auth/admin-auth.service";
import { ADMIN_REFRESH_COOKIE, eraseAdminSession, writeAdminSession } from "src/server/core/auth/admin-cookies";
import { createPostRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

/**
 * Lives beneath the refresh cookie's path, so the cookie reaches it. A failed
 * rotation clears both cookies: whatever was presented is no longer usable.
 */
export const POST = createPostRoute({
  auth: false,
  successStatus: 200,
  handler: async () => {
    const presented = (await cookies()).get(ADMIN_REFRESH_COOKIE)?.value;
    try {
      await writeAdminSession(await refreshAdminSession(presented));
      return { refreshed: true };
    } catch (error) {
      await eraseAdminSession();
      throw error;
    }
  },
});
