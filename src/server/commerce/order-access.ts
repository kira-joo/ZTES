import { NotFoundError } from "@kira-joo/backend-toolkit-core";
import { sha256, safeEqualHex } from "src/server/core/crypto";
import { OrderModel, type OrderSchema } from "./order.schema";
import { readOrderTokens } from "./storefront-cookies";

/**
 * A guest reaches their order only with the token placed in their httpOnly
 * cookie at checkout. A wrong or missing token is indistinguishable from an
 * order that does not exist.
 */
export async function findAccessibleOrder(orderNumber: string): Promise<OrderSchema> {
  const token = (await readOrderTokens())[orderNumber];
  if (!token) throw new NotFoundError("Order not found.");
  const order = await OrderModel.findOne({ orderNumber }).select("+accessTokenHash").lean<OrderSchema>();
  if (!order || !safeEqualHex(order.accessTokenHash, sha256(token))) throw new NotFoundError("Order not found.");
  const { accessTokenHash: _hidden, ...visible } = order;
  void _hidden;
  return visible as OrderSchema;
}
