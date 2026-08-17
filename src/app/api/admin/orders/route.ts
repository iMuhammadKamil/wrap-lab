import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, ok, fail, handleError, stripTenantId, ADMIN_STATUSES } from "../_lib/helpers";

// GET /api/admin/orders — tenant orders desc, optional ?status= filter
export async function GET(req: NextRequest) {
  try {
    const user = await requireAdmin();
    const status = req.nextUrl.searchParams.get("status");

    const where: { tenantId: string; status?: string } = { tenantId: user.tenantId };
    if (status && status !== "all") {
      if (!ADMIN_STATUSES.includes(status as (typeof ADMIN_STATUSES)[number])) {
        return fail("Invalid status filter", 400);
      }
      where.status = status;
    }

    const orders = await db.order.findMany({
      where,
      include: { items: { orderBy: { id: "asc" } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return ok(orders.map((o) => ({ ...stripTenantId(o), items: o.items.map(stripTenantId) })));
  } catch (error) {
    return handleError(error, "Failed to fetch orders");
  }
}