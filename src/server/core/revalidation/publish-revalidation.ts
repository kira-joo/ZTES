import { revalidateTag } from "next/cache";

/**
 * In-process invalidation. Storefront and admin are one application, so a
 * mutation expires the storefront's cached reads directly — there is no
 * publish/receive HTTP hop to misconfigure.
 *
 * `expire: 0` makes the next read a blocking miss rather than a stale serve,
 * so no customer sees an old price after the admin changes it.
 */
export async function publishRevalidation(tags: string[]): Promise<void> {
  for (const tag of new Set(tags)) revalidateTag(tag, { expire: 0 });
}
