import { createApiClient, fetchAdapter } from "@kira-joo/frontend-toolkit-core/server";

/**
 * The browser-side client for this application's own API. Storefront and
 * admin share one origin with the API, so the fetch adapter (credentials
 * included by the browser for same-origin requests) is all that is needed —
 * no token is ever read or attached by page script.
 */
let storefrontClient: ReturnType<typeof createApiClient> | undefined;
let adminClient: ReturnType<typeof createApiClient> | undefined;

export function getStorefrontApi() {
  storefrontClient ??= createApiClient({ baseURL: "/api/storefront", adapter: fetchAdapter });
  return storefrontClient;
}

export function getAdminApi() {
  adminClient ??= createApiClient({ baseURL: "/api/admin", adapter: fetchAdapter });
  return adminClient;
}
