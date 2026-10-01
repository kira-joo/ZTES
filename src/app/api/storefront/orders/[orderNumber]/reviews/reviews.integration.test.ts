// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Locale, OrderStatus } from "src/common/enums";
import { ReviewModel } from "src/server/catalog/review.schema";
import { OrderModel } from "src/server/commerce/order.schema";
import { placeOrder } from "src/server/commerce/place-order";
import { ORDERS_COOKIE } from "src/server/commerce/storefront-cookies";
import { cookieJar } from "src/test/cookie-jar";
import { address, contact, makeCart, makeProduct } from "src/test/fixtures";
import { setupTestDatabase } from "src/test/mongo";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", async () => (await import("src/test/cookie-jar")).mockHeadersModule);
vi.mock("next/cache", () => ({ revalidateTag: vi.fn(), unstable_cache: (fn: () => unknown) => fn }));

setupTestDatabase();

beforeEach(() => cookieJar.clear());

/** A delivered order for a product that already has one (imported) review. */
async function deliveredOrder() {
  const product = await makeProduct({ ratingBaseline: { average: 5, count: 1 } });
  const existing = await ReviewModel.create({
    product: product._id,
    authorName: "هيام",
    rating: 5,
    body: "بجد يستاهل كل ريال اندفع فيه",
    reviewedAt: new Date("2026-01-01T00:00:00Z"),
    legacy: { sallaId: "imported-1" },
  });
  const { tokenHash } = await makeCart([{ product: product._id, quantity: 1 }]);
  const { orderNumber, accessToken } = await placeOrder({
    cartTokenHash: tokenHash,
    contact: contact(),
    address,
    safeUseAccepted: true,
    locale: Locale.AR,
  });
  await OrderModel.updateOne({ orderNumber }, { $set: { status: OrderStatus.DELIVERED } });
  cookieJar.set(ORDERS_COOKIE, JSON.stringify({ [orderNumber]: accessToken }));
  return { product, orderNumber, existing };
}

async function submit(orderNumber: string, body: Record<string, unknown>) {
  const { POST } = await import("./route");
  const request = new NextRequest(`http://localhost/api/storefront/orders/${orderNumber}/reviews`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: cookieJar.header() },
    body: JSON.stringify(body),
  });
  return POST(request, { params: Promise.resolve({ orderNumber }) });
}

describe("customer review submission", () => {
  it("stores the review in MongoDB and shows it on the product page beside the existing ones", async () => {
    const { product, orderNumber, existing } = await deliveredOrder();
    const response = await submit(orderNumber, {
      productId: String(product._id),
      rating: 4,
      authorName: "سارة",
      body: "جيد جدا",
    });
    expect(response.status).toBe(201);

    const stored = await ReviewModel.find({ product: product._id, order: { $ne: null } }).lean();
    expect(stored).toEqual([expect.objectContaining({ authorName: "سارة", rating: 4, isPublished: true })]);

    const { getProductReviews } = await import("src/server/storefront/catalog.reads");
    const { items, total } = await getProductReviews(String(product._id), 1, 10);
    expect(total).toBe(2);
    expect(items.map((item) => item._id)).toEqual([String(stored[0]!._id), String(existing._id)]);
  });

  it("puts the newest published reviews with text first in the home carousel, capped at the limit", async () => {
    const { product, orderNumber, existing } = await deliveredOrder();
    await ReviewModel.create({
      product: product._id,
      authorName: "مخفي",
      rating: 1,
      body: "غير منشور",
      isPublished: false,
    });
    await ReviewModel.create({
      product: product._id,
      authorName: "بلا نص",
      rating: 5,
      reviewedAt: new Date(),
    });
    expect(
      (
        await submit(orderNumber, {
          productId: String(product._id),
          rating: 5,
          authorName: "سارة",
          body: "ممتاز",
        })
      ).status
    ).toBe(201);
    const stored = await ReviewModel.findOne({ order: { $ne: null } }).lean();

    const { getRecentReviews } = await import("src/server/storefront/catalog.reads");
    expect((await getRecentReviews(50)).map((item) => item._id)).toEqual([
      String(stored!._id),
      String(existing._id),
    ]);
    expect(await getRecentReviews(1)).toHaveLength(1);
  });

  it("refuses a second review of the same product from the same order", async () => {
    const { product, orderNumber } = await deliveredOrder();
    const body = { productId: String(product._id), rating: 5, authorName: "سارة" };
    expect((await submit(orderNumber, body)).status).toBe(201);
    expect((await submit(orderNumber, body)).status).toBe(409);
  });
});
