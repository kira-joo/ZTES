import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Polite, cached HTTP for the reference importer.
 *
 * - Every fetched page is cached to `data/reference/raw/<kind>/<file>` so a
 *   re-run never re-fetches (pass `refresh: true` to bypass for one call).
 * - Concurrency is capped and a fixed delay is inserted between requests
 *   (see `withPoliteConcurrency`) — the reference store gets no more load
 *   than a slow, careful human clicking through it.
 * - `orkidastore.com`'s SSR occasionally serves a 200 page with a
 *   `<meta http-equiv="refresh">` instead of a real HTTP redirect (observed
 *   for a stale category slug) — `fetchHtml` follows that once, the same way
 *   it relies on `fetch`'s own redirect-following for a real 3xx.
 */

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";

const RAW_DIR = path.resolve(process.cwd(), "data/reference/raw");

const REQUEST_TIMEOUT_MS = 25_000;

export interface FetchOptions {
  refresh?: boolean;
  /** Cache subdirectory, e.g. "product". */
  kind: string;
  /** Cache file name, e.g. "266433170.ar.html" — no directory. */
  cacheFile: string;
}

function metaRefreshTarget(html: string): string | null {
  const match = /<meta\s+http-equiv=["']refresh["']\s+content=["']0;\s*url=['"]([^'"]+)['"]/i.exec(html);
  return match ? match[1]! : null;
}

async function readCache(kind: string, file: string): Promise<string | null> {
  try {
    return await readFile(path.join(RAW_DIR, kind, file), "utf8");
  } catch {
    return null;
  }
}

async function writeCache(kind: string, file: string, content: string): Promise<void> {
  const dir = path.join(RAW_DIR, kind);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, file), content, "utf8");
}

/**
 * When the reference answers 429/503, every worker waits — not just the one
 * that was refused — so a rate limit slows the whole run down instead of being
 * retried into harder.
 */
let pausedUntil = 0;

async function waitForPause(): Promise<void> {
  const wait = pausedUntil - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
}

/**
 * Set only inside {@link fetchOnce} — i.e. only on a REAL network request,
 * never on a cache hit. `withPoliteConcurrency` paces its delay off this
 * instead of pacing unconditionally, so a fully-cached re-run (the normal
 * case after a crash mid-run) replays at disk speed instead of re-waiting
 * `delayMs` per item for requests that never left the machine.
 */
let lastNetworkFetchAt = 0;

async function fetchOnce(url: string): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 7; attempt++) {
    await waitForPause();
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (response.status === 429 || response.status === 503) {
        const retryAfter = Number(response.headers.get("retry-after"));
        const pauseMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : Math.min(120_000, 15_000 * 2 ** attempt);
        pausedUntil = Math.max(pausedUntil, Date.now() + pauseMs);
        console.warn(`[reference:http] ${response.status} — pausing all requests for ${Math.round(pauseMs / 1000)}s`);
        throw new Error(`HTTP ${response.status} for ${url}`);
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }
      const body = await response.text();
      lastNetworkFetchAt = Date.now();
      return body;
    } catch (error) {
      lastError = error;
      if (attempt < 6) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** Math.min(attempt, 4)));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/** Fetches (or reads from cache) one page. Follows a client-side meta-refresh once. */
export async function fetchHtml(url: string, options: FetchOptions): Promise<string> {
  if (!options.refresh) {
    const cached = await readCache(options.kind, options.cacheFile);
    if (cached !== null) return cached;
  }

  let html = await fetchOnce(url);
  const redirectTarget = metaRefreshTarget(html);
  if (redirectTarget) {
    html = await fetchOnce(redirectTarget.startsWith("http") ? redirectTarget : new URL(redirectTarget, url).toString());
  }

  await writeCache(options.kind, options.cacheFile, html);
  return html;
}

export async function fetchText(url: string, options: FetchOptions): Promise<string> {
  // Sitemaps are XML but the same cache/retry shape applies.
  return fetchHtml(url, options);
}

/**
 * Runs `items` through `worker` with bounded concurrency and a fixed delay
 * between each request *starting* — never more than `concurrency` in flight,
 * and never faster than one new request every `delayMs`.
 */
export async function withPoliteConcurrency<T, R>(
  items: T[],
  worker: (item: T, index: number) => Promise<R>,
  options: { concurrency?: number; delayMs?: number } = {}
): Promise<R[]> {
  const concurrency = options.concurrency ?? 3;
  const delayMs = options.delayMs ?? 300;
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function runOne(): Promise<void> {
    for (;;) {
      const index = nextIndex++;
      if (index >= items.length) return;
      results[index] = await worker(items[index]!, index);
      if (index < items.length - 1) {
        // Only wait long enough that the NEXT real network request is at
        // least `delayMs` after the last one — a cache-hit-only stretch (a
        // re-run after a crash, say) costs nothing extra here.
        const wait = delayMs - (Date.now() - lastNetworkFetchAt);
        if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => runOne());
  await Promise.all(workers);
  return results;
}

/**
 * Percent-decodes a sitemap `<loc>` URL for use as a fetch target. Orkida's
 * sitemap encodes spaces as a literal `+` (form encoding) inside an otherwise
 * percent-encoded path segment, which `fetch`/`URL` do NOT decode back to a
 * space (unlike a query string) — left as `+`, the request 200s but silently
 * resolves to the homepage instead of the intended page. Converting to
 * `%20` first fixes it.
 */
export function normalizeSitemapUrl(loc: string): string {
  return loc.replace(/\+/g, "%20");
}
