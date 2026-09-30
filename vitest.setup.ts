import "@testing-library/jest-dom/vitest";
import "reflect-metadata";

// Throwaway values so modules that configure the toolkit at load can be imported.
process.env.JWT_SECRET ??= "test-only-jwt-secret-at-least-32-characters-long";
process.env.ADMIN_PASSWORD ??= "test-only-admin-password";
process.env.ADMIN_TOKEN_VERSION ??= "1";
process.env.SITE_URL ??= "http://localhost:3030";
