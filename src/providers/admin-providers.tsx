"use client";

import { adminLogoutEndpoint, adminRefreshEndpoint } from "src/common/api/admin-auth.endpoints";
import {
  APIConfig,
  AppLinkConfig,
  clearAuthenticatedQueries,
  createToolkitQueryClient,
  getDefaultApiClient,
  QueryParamsRouterProvider,
  ToolkitProviders,
  type AppLinkComponentProps,
} from "@kira-joo/frontend-toolkit-core";
import { DialogProvider } from "@kira-joo/frontend-toolkit-tailwind/dialog";
import { showApiErrorToast, Toaster } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { getAdminApi } from "src/lib/api-client";
import { useAdminQueryParamsRouter } from "src/components/admin/use-admin-query-params-router";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Module-level, not per-mount: the retry policy belongs to the application,
 * and a client rebuilt on every render would drop the cache every page keeps
 * re-reading from.
 */
export const adminQueryClient = createToolkitQueryClient({
  onError: (error) => showApiErrorToast(error),
});

const ADMIN_LOGIN_PATH = "/admin/login";

/**
 * `FeatureTable`, `CustomForm`, every `Feature*`/`useEndpointOptions` call and
 * plain `requester()` all go through the process-wide default client
 * (`APIConfig`), never a `client` prop — see `@kira-joo/frontend-toolkit-core`.
 * This module is only ever imported under `/admin` (a separate root layout
 * from the storefront's `[locale]` tree), so configuring the shared statics
 * here cannot leak into the storefront's own bundle.
 */
APIConfig.baseURL = "/api/admin";

/**
 * Single-flighted by the client itself: several queries failing at once still
 * trigger exactly one refresh. `skipAuthRefresh: true` on the refresh call
 * itself is required, or a failing refresh would recurse into its own retry.
 */
APIConfig.refreshAuth = async () => {
  try {
    await getDefaultApiClient().request(adminRefreshEndpoint, { skipAuthRefresh: true });
    return true;
  } catch {
    return false;
  }
};

APIConfig.onUnauthorized = () => {
  clearAuthenticatedQueries(adminQueryClient);
  if (typeof window !== "undefined" && !window.location.pathname.startsWith(ADMIN_LOGIN_PATH)) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    // A hard navigation is deliberate here: this fires from plain (non-React)
    // config callback code that may run far outside any component's event
    // handler, so `useRouter()` is not available — same pattern as the
    // reference app's `AppProvider`.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`${ADMIN_LOGIN_PATH}?next=${next}`);
  }
};

/**
 * `getAdminApi()` (a second, explicitly-created client with the same base
 * URL — see src/lib/api-client.ts) is mutated to match, so any admin code
 * that reaches for it directly (rather than the default client) gets
 * identical refresh/redirect behaviour. `createApiClient` closes over the
 * same config object it returns, so mutating `.config` after construction is
 * observed by every subsequent request — see its implementation.
 */
const adminApi = getAdminApi();
adminApi.config.refreshAuth = APIConfig.refreshAuth;
adminApi.config.onUnauthorized = APIConfig.onUnauthorized;

AppLinkConfig.Component = Link as unknown as React.ComponentType<AppLinkComponentProps>;

/** No English lives in the toolkit; the admin supplies its own copy once, here. */
const DIALOG_LABELS = {
  close: "Close",
  confirm: "Confirm",
  cancel: "Cancel",
  save: "Save",
  fallbackMessage: "Are you sure?",
};

export async function adminLogout(): Promise<void> {
  try {
    await getDefaultApiClient().request(adminLogoutEndpoint);
  } finally {
    clearAuthenticatedQueries(adminQueryClient);
  }
}

export function AdminProviders({ children }: { children: ReactNode }) {
  return (
    <ToolkitProviders client={adminQueryClient}>
      <QueryParamsRouterProvider useAdapter={useAdminQueryParamsRouter}>
        <DialogProvider labels={DIALOG_LABELS}>
          {children}
          <Toaster />
        </DialogProvider>
      </QueryParamsRouterProvider>
    </ToolkitProviders>
  );
}
