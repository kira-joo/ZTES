"use client";

import { SideNav, SideNavLayout, SideNavProvider } from "@kira-joo/frontend-toolkit-tailwind/primitives";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { adminLogout } from "src/providers/admin-providers";
import { ADMIN_NAV_SECTIONS } from "./admin-nav-sections";

/** The panel chrome: a fixed sidebar plus an independently-scrolling content region. */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    // Server first: the route clears both cookies, and navigating before it
    // returns would race the redirect against the clear.
    await adminLogout().catch(() => undefined);
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <SideNavProvider persistCollapsed>
      <SideNavLayout
        sidebar={
          <SideNav
            pathname={pathname}
            brand={{ type: "title", title: "ZTES Admin" }}
            sections={ADMIN_NAV_SECTIONS}
            onLogout={handleLogout}
            logoutLabel="Log out"
          />
        }
      >
        {children}
      </SideNavLayout>
    </SideNavProvider>
  );
}
