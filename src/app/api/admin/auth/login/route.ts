import { AdminLoginDto } from "src/server/core/auth/dto/login.dto";
import { loginAdmin } from "src/server/core/auth/admin-auth.service";
import { writeAdminSession } from "src/server/core/auth/admin-cookies";
import { enforceRateLimit, RATE_LIMITS, resolveClientIp } from "src/server/core/rate-limit/rate-limit";
import { createPostRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

/** One admin, one password. Rate-limited per IP; every failure says the same thing. */
export const POST = createPostRoute({
  auth: false,
  successStatus: 200,
  body: AdminLoginDto,
  handler: async ({ body, request }) => {
    await enforceRateLimit({ key: `admin-login:${resolveClientIp(request)}`, ...RATE_LIMITS.LOGIN });
    const session = await loginAdmin(body.password);
    await writeAdminSession(session);
    return { signedIn: true };
  },
});
