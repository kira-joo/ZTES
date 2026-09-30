import { createMongoModel, createRefreshTokenSchema } from "@kira-joo/backend-toolkit-mongoose";
import { EntityName } from "src/common/enums";

/** SHA-256 hashes only; a database disclosure must not hand out working sessions. */
export const AdminRefreshTokenSchema = createRefreshTokenSchema({ collection: "admin_refresh_tokens" });

export const AdminRefreshTokenModel = createMongoModel(EntityName.ADMIN_REFRESH_TOKEN, AdminRefreshTokenSchema);
