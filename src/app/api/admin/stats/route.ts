import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, ok, handleError } from "../_lib/helpers";

// GET /api/admin/stats — dashboard summary
export async function GET() {
  try {
    const user = await requireAdmin();

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