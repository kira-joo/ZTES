// @vitest-environment node
import { describe, expect, it } from "vitest";
import { deepUnsliceStrings, extractMetaTags } from "./html-utils";

/**
 * Regression test for the memory leak that crashed a full reference scrape
 * (`JavaScript heap out of memory` at product 750/1242, ~2.2MB retained per
 * product — a heap that should have held ~11KB per product).
 *
 * Root cause: `RegExp.exec()` on a large subject can return a capturing
 * group that is a V8 "sliced string" internally pointing at the whole
 * subject. `extractMetaTags` builds its result from exactly such groups, and
 * when a value has no HTML entities `decodeHtmlEntities` passes that sliced
 * group straight through unchanged. A page's meta tags therefore each held
 * the ENTIRE page alive — invisible in a size check on the meta object
 * itself, since `string.length` reports the visible length, not what the
 * string secretly still points at.
 *
 * `heapUsed` growing roughly linearly with iteration count over hundreds of
 * reps — without ever forcing GC — is exactly the signature this leak
 * produced; a fix that flattens the strings keeps growth flat instead.
 */
/**
 * A fresh, distinct ~1.2MB page per call — one page per iteration, exactly
 * like the real scraper reading a different cached file each time. Reusing
 * ONE large string across every iteration (the first version of this test
 * did that) cannot show this leak at all: every result would then be a slice
 * of the SAME already-live parent, so the "leaked" bytes are paid for once
 * up front and never grow — the test would pass whether or not the code
 * being tested actually leaks anything. Verified directly: the reused-string
 * version showed ~0.9MB of growth either way; this version shows ~360MB
 * unfixed vs ~16MB fixed, matching the real crash.
 */
function makeProductLikePage(seed: number): string {
  const padding = "x".repeat(1_200_000) + seed;
  return `<!doctype html><html><body>
    <meta property="og:title" content="Sample Product">
    <meta property="product:price:amount" content="89.00">
    <meta property="product:category" content="Pest Control, Sprays">
    <!-- ${padding} -->
  </body></html>`;
}

describe("extractMetaTags does not leak the page behind its small values", () => {
  it("parsing many distinct large pages does not retain each page's full bytes", () => {
    const before = process.memoryUsage().heapUsed;
    const iterations = 300;
    const results: Record<string, string>[] = [];
    for (let i = 0; i < iterations; i++) {
      const tags = deepUnsliceStrings(extractMetaTags(makeProductLikePage(i)));
      if (tags["og:title"] !== "Sample Product") throw new Error("unexpected extraction");
      results.push(tags);
    }
    const after = process.memoryUsage().heapUsed;

    // Un-fixed, this leaked the ~1.2MB page on every single iteration —
    // 300 reps demands ~360MB. A bounded, generous ceiling (60MB) comfortably
    // separates "flat, as expected" (measured ~16MB) from "leaking the page".
    expect(after - before).toBeLessThan(60 * 1024 * 1024);
    expect(results).toHaveLength(iterations);
  });

  it("still decodes entities correctly after flattening", () => {
    const html = `<meta property="og:title" content="Tom &amp; Jerry">`;
    expect(deepUnsliceStrings(extractMetaTags(html))["og:title"]).toBe("Tom & Jerry");
  });
});
