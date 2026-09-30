"use client";

import type { QueryParamsRouterState } from "@kira-joo/frontend-toolkit-core";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * The App Router-backed adapter `FeatureTable`'s `syncWithUrl` needs.
 *
 * Without a `QueryParamsRouterProvider` using this, every `FeatureTable`'s
 * search/filter/sort/page state is a silent no-op — the table renders but
 * never responds to input, with only a dev-console warning to explain why.
 * Wired once at the admin panel root instead of per screen.
 */
export function useAdminQueryParamsRouter(): QueryParamsRouterState {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (nextSearchParams: URLSearchParams, options?: { replace?: boolean }) => {
      const queryString = nextSearchParams.toString();
      const href = queryString ? `${pathname}?${queryString}` : pathname;
      if (options?.replace) {
        router.replace(href, { scroll: false });
      } else {
        router.push(href, { scroll: false });
      }
    },
    [router, pathname]
  );

  return { searchParams, navigate };
}
