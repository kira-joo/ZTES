import { MethodType, type Endpoint } from "@kira-joo/frontend-toolkit-core/server";

/** Paths relative to `/api/admin` (see src/lib/api-client.ts / getAdminApi()). */
export const ADMIN_AUTH_ROUTES = {
  login: "/auth/login",
  me: "/auth/me",
  refresh: "/auth/token/refresh",
  logout: "/auth/token/logout",
} as const;

export const adminLoginEndpoint: Endpoint<{
  body: { password: string };
  returnType: { signedIn: true };
}> = { url: ADMIN_AUTH_ROUTES.login, methodType: MethodType.POST };

export const adminMeEndpoint: Endpoint<{ returnType: { id: string; name: string } }> = {
  url: ADMIN_AUTH_ROUTES.me,
  methodType: MethodType.GET,
};

/** Lives beneath the refresh cookie's path — always call with `skipAuthRefresh: true`. */
export const adminRefreshEndpoint: Endpoint<{ returnType: { refreshed: true } }> = {
  url: ADMIN_AUTH_ROUTES.refresh,
  methodType: MethodType.POST,
};

export const adminLogoutEndpoint: Endpoint<{ returnType: { signedOut: true } }> = {
  url: ADMIN_AUTH_ROUTES.logout,
  methodType: MethodType.POST,
};
