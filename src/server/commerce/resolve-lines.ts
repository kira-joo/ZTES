import { resolveSession } from "@kira-joo/backend-toolkit-mongoose";
import { toMoney, type LocalizedString, type Money } from "@kira-joo/toolkit-common";
import { readMoney } from "src/server/core/money";
import mongoose from "mongoose";
import { ProductModel, type ProductSchema, type QuantityTier } from "src/server/catalog/product.schema";

/**
 * Turns cart lines (keys only) into priced, validated lines against the live
 * catalog. Used by the cart read and by order placement — the same rules, so a
 * cart that looks fine cannot fail placement for a reason the cart hid.
 */
export interface LineRequest {
  lineId: string;
  productId: string;
  optionValueIds: string[];
  quantity: number;
}

export enum LineIssue {
  UNAVAILABLE = "UNAVAILABLE",
  OUT_OF_STOCK = "OUT_OF_STOCK",
  INSUFFICIENT_STOCK = "INSUFFICIENT_STOCK",
  OPTION_REQUIRED = "OPTION_REQUIRED",
  OPTION_UNAVAILABLE = "OPTION_UNAVAILABLE",
}

export interface ResolvedOption {
  groupId: mongoose.Types.ObjectId;
  group: LocalizedString;
  valueId: mongoose.Types.ObjectId;
  value: LocalizedString;
  priceDelta: Money;
}

export interface ResolvedLine {
  lineId: string;
  productId: string;
  product: Pick<
    ProductSchema,
    "_id" | "name" | "slug" | "sku" | "images" | "price" | "compareAtPrice" | "stock" | "trackStock" | "weight"
  > | null;
  options: ResolvedOption[];
  unitPrice: Money;
  quantity: number;
  tiers: QuantityTier[];
  issue: LineIssue | null;
  /** For INSUFFICIENT_STOCK: how many can be bought. */
  available?: number;
}

type LeanProduct = ProductSchema & { deletedAt?: Date | null };

export async function resolveLines(requests: readonly LineRequest[]): Promise<ResolvedLine[]> {
  const ids = [...new Set(requests.map((line) => line.productId))].filter((id) => mongoose.isValidObjectId(id));
  const products = await ProductModel.find({ _id: { $in: ids } })
    .session(resolveSession() ?? null)
    .lean<LeanProduct[]>();
  const byId = new Map(products.map((product) => [String(product._id), product]));

  // Stock is shared across lines of the same product with different options.
  const requestedPerProduct = new Map<string, number>();
  for (const line of requests) {
    requestedPerProduct.set(line.productId, (requestedPerProduct.get(line.productId) ?? 0) + line.quantity);
  }

  return requests.map((line) => {
    const product = byId.get(line.productId);
    if (!product || !product.isActive || product.deletedAt) {
      return {
        lineId: line.lineId,
        productId: line.productId,
        product: null,
        options: [],
        unitPrice: toMoney(0),
        quantity: line.quantity,
        tiers: [],
        issue: LineIssue.UNAVAILABLE,
      };
    }

    const chosen = new Set(line.optionValueIds.map(String));
    const options: ResolvedOption[] = [];
    let issue: LineIssue | null = null;

    for (const group of product.options ?? []) {
      const value = group.values.find((candidate) => chosen.has(String(candidate._id)));
      if (!value) {
        if (group.required && group.values.length > 0) issue ??= LineIssue.OPTION_REQUIRED;
        continue;
      }
      if (!value.isAvailable) issue ??= LineIssue.OPTION_UNAVAILABLE;
      options.push({
        groupId: group._id,
        group: group.name,
        valueId: value._id,
        value: value.label,
        priceDelta: readMoney(value.priceDelta),
      });
    }

    const unitPrice = options.reduce<Money>((acc, option) => acc.plus(option.priceDelta), readMoney(product.price));
    let available: number | undefined;

    if (!issue && product.trackStock) {
      const requested = requestedPerProduct.get(line.productId) ?? line.quantity;
      if (product.stock <= 0) issue = LineIssue.OUT_OF_STOCK;
      else if (requested > product.stock) {
        issue = LineIssue.INSUFFICIENT_STOCK;
        available = product.stock;
      }
    }

    return {
      lineId: line.lineId,
      productId: line.productId,
      product,
      options,
      unitPrice,
      quantity: line.quantity,
      tiers: product.quantityTiers ?? [],
      issue,
      ...(available !== undefined ? { available } : {}),
    };
  });
}
