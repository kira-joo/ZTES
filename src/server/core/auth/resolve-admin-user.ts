import type { AuthUser } from "@kira-joo/backend-toolkit-core";
import { ADMIN_SUBJECT_ID, adminUser } from "./admin-identity";

/** The toolkit's `resolveUser`: any subject other than the admin's is nobody. */
export async function resolveAdminUser(userId: string): Promise<AuthUser | null> {
  return userId === ADMIN_SUBJECT_ID ? adminUser() : null;
}
