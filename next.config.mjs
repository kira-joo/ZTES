import path from "node:path";
import { fileURLToPath } from "node:url";
import createNextIntlPlugin from "next-intl/plugin";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Sibling repositories share no lockfile; without a pinned root Turbopack walks
  // up out of the repo looking for one.
  turbopack: { root: projectRoot },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  // Node-only; imported from src/server/** alone. External so a stray client
  // import fails the build instead of bloating a bundle.
  // Not sanitize-html: it is CommonJS and require()s htmlparser2 12, which is
  // ESM-only, so loading it external fails with ERR_REQUIRE_ESM on Vercel's
  // runtime. Bundled, the ESM dependency is resolved at build time.
  serverExternalPackages: ["mongoose", "cloudinary"],
  // `next dev` otherwise writes into CLAUDE.md on every run.
  agentRules: false,
};

export default withNextIntl(nextConfig);
