import { startOfDayInZone, addDaysInZone, ZERO } from "@kira-joo/toolkit-common";
import { STORE_TIMEZONE } from "src/common/config/store";
import { OrderStatus } from "src/common/enums";
import { ProductModel } from "src/server/catalog/product.schema";
import { OrderModel } from "src/server/commerce/order.schema";
import { CustomerModel } from "src/server/commerce/customer.schema";
import { readMoney } from "src/server/core/money";
import { createGetRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

/** Today and the last seven store-local days, plus what needs attention. */
export const GET = createGetRoute({
  auth: true,
  handler: async () => {
    const now = new Date();
    const today = startOfDayInZone(now, STORE_TIMEZONE);
    const weekStart = addDaysInZone(now, -6, STORE_TIMEZONE);

    const [byStatus, todayOrders, weekOrders, deliveredWeek, lowStock, latest, customers, mismatches] = await Promise.all([
      OrderModel.aggregate<{ _id: OrderStatus; count: number }>([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      OrderModel.countDocuments({ createdAt: { $gte: today }, status: { $ne: OrderStatus.CANCELLED } }),
      OrderModel.countDocuments({ createdAt: { $gte: weekStart }, status: { $ne: OrderStatus.CANCELLED } }),
      OrderModel.find({ createdAt: { $gte: weekStart }, status: OrderStatus.DELIVERED }).select("pricing.total").lean(),
      ProductModel.find({ deletedAt: null, isActive: true, trackStock: true, stock: { $lte: 5 } })
        .select("name stock images slug")
        .sort({ stock: 1 })
        .limit(10)
        .lean(),
      OrderModel.find().sort({ createdAt: -1 }).limit(8).select("orderNumber contact pricing.total status createdAt").lean(),
      CustomerModel.countDocuments(),
      OrderModel.countDocuments({ contactMismatch: true, status: { $ne: OrderStatus.CANCELLED } }),
    ]);

    const deliveredRevenue = deliveredWeek.reduce((acc, order) => acc.plus(readMoney(order.pricing?.total)), ZERO);

    return {
      ordersByStatus: Object.fromEntries(Object.values(OrderStatus).map((status) => [status, byStatus.find((row) => row._id === status)?.count ?? 0])),
      ordersToday: todayOrders,
      ordersThisWeek: weekOrders,
      deliveredRevenueThisWeek: deliveredRevenue.toFixed(2),
      lowStock,
      latestOrders: latest,
      customerCount: customers,
      contactMismatches: mismatches,
    };
  },
});
