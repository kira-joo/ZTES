import type { NextJwtConfig } from "@kira-joo/backend-toolkit-next";
import { requireSecret } from "src/server/core/config/env";

export function adminJwtConfig(): NextJwtConfig {
  return {
    secret: requireSecret("JWT_SECRET"),
    defaultExpiresIn: process.env.ADMIN_ACCESS_TOKEN_TTL ?? "15m",
  };
}
