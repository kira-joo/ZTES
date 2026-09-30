import "server-only";
import { unstable_cache } from "next/cache";
import { connectToDatabase } from "src/server/core/db/connect";
import { toPlain } from "src/server/core/serialization/to-plain";

/**
 * A storefront read: connects, runs, converts to plain JSON, and caches under
 * the given tags. The admin routes declare the same tags, so a write expires
 * exactly the reads it affects. The hour-long ceiling is only a backstop.
 */
export function cachedRead<TArgs extends unknown[], TResult>(
  name: string,
  tags: string[],
  read: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) =>
    unstable_cache(
      async () => {
        await connectToDatabase();
        return toPlain(await read(...args));
      },
      [name, JSON.stringify(args)],
      { tags, revalidate: 3600 }
    )();
}
