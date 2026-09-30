import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      src: path.resolve(__dirname, "./src"),
      api: path.resolve(__dirname, "./api"),
    },
  },
  test: {
    // Server suites opt into node with `// @vitest-environment node`.
    environment: "jsdom",
    globals: true,
    // Real password hashing and replica-set transactions are slow on a cold start.
    testTimeout: 30_000,
    hookTimeout: 60_000,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
    // Schema decorators register models as module side effects; one registry per run.
    pool: "forks",
    server: {
      deps: {
        // backend-toolkit-next imports `next/server` through Next's exports map,
        // which Node's raw ESM resolution does not consult.
        inline: [/@kira-joo\/backend-toolkit-next/],
      },
    },
  },
});
