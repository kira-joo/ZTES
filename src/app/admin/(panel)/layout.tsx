import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminShell } from "src/components/admin/admin-shell";
import { isAdminSignedIn } from "src/server/core/auth/current-admin";

/**
 * UX only — every admin API route enforces `auth: true` itself. This just
 * stops an unauthenticated visitor from seeing the panel chrome flash before
 * every query in it starts failing with 401s.
 */
export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  if (!(await isAdminSignedIn())) redirect("/admin/login");

  return <AdminShell>{children}</AdminShell>;
}
