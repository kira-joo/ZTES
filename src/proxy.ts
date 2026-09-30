import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "src/i18n/routing";

const intl = createMiddleware(routing);

/** Mirrors ADMIN_SESSION_COOKIE (the proxy must not import server code). */
const ADMIN_SESSION = "ztes_admin_session";

/**
 * `/admin/**` is English-only and outside next-intl. Without a session cookie
 * it redirects to the login page — cosmetic only: every admin API route
 * enforces authentication itself. The refresh cookie is path-scoped to the
 * refresh route and never reaches here, so an expired session lands on the
 * login page, which silently tries a refresh before asking for the password.
 */
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const isLogin = pathname === "/admin/login";
    const hasSession = Boolean(request.cookies.get(ADMIN_SESSION));
    if (!isLogin && !hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      url.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return intl(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
