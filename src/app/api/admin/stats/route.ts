import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readLocalDb, useLocalStore } from "@/lib/local-store";
import { requireAdmin, ok, handleError } from "../_lib/helpers";

// GET /api/admin/stats — dashboard summary
export async function GET() {
  try {
    const user = await requireAdmin();

    if (useLocalStore()) {
      const store = readLocalDb();
      const tenantOrders = store.orders.filter((o) => o.tenantId === user.tenantId);
      const totalOrders = tenantOrders.length;
      const revenue = tenantOrders
        .filter((o) => o.status !== "cancelled")
        .reduce((s, o) => s + o.total, 0);
      const pendingOrders = tenantOrders.filter((o) => o.status === "pending").length;
      const productCount = store.products.filter((p) => p.tenantId === user.tenantId).length;
      return ok({ totalOrders, revenue, pendingOrders, productCount });
    }

    const [totalOrders, revenueAgg, pendingOrders, productCount] = await Promise.all([
      db.order.count({ where: { tenantId: user.tenantId } }),
      db.order.aggregate({
        where: { tenantId: user.tenantId, status: { not: "cancelled" } },
        _sum: { total: true },
      }),
      db.order.count({ where: { tenantId: user.tenantId, status: "pending" } }),
      db.product.count({ where: { tenantId: user.tenantId } }),
    ]);

    return ok({
      totalOrders,
      revenue: revenueAgg._sum.total ?? 0,
      pendingOrders,
      productCount,
    });
  } catch (error) {
    return handleError(error, "Failed to fetch stats");
  }
}