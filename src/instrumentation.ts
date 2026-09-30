// Decorator metadata must exist before any DTO or schema class is evaluated.
import "reflect-metadata";

/**
 * Runs once per server instance before any request: configures the toolkit,
 * connects (which verifies every declared index), and announces capabilities
 * that are configured OFF — a silent no-op is indistinguishable from a broken one.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { configureToolkit } = await import("src/server/core/toolkit.config");
  configureToolkit();

  const { assertAdminPasswordConfigured } = await import("src/server/core/auth/admin-auth.service");
  assertAdminPasswordConfigured();

  const { connectToDatabase } = await import("src/server/core/db/connect");
  await connectToDatabase();

  const { assetProvider } = await import("src/server/core/assets");
  if (!assetProvider()) {
    console.warn(
      "[assets] Cloudinary is NOT configured (CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET). " +
        "Image uploads are OFF; saves without images still work."
    );
  }
}
