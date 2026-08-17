import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, ok, fail, handleError, stripTenantId, ADMIN_STATUSES } from "../../_lib/helpers";

// PATCH /api/admin/orders/[id] — update order status only
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    const { id } = await params;

    const existing = await db.order.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) return fail("Order not found", 404);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || typeof body.status !== "string") {
      return fail("Order status is required", 400);
    }

    const status = body.status;
    if (!ADMIN_STATUSES.includes(status as (typeof ADMIN_STATUSES)[number])) {
      return fail("Invalid order status", 400);
    }

    const order = await db.order.update({
      where: { id },
      data: { status },
      include: { items: { orderBy: { id: "asc" } } },
    });

    return ok({ ...stripTenantId(order), items: order.items.map(stripTenantId) });
  } catch (error) {
    return handleError(error, "Failed to update order");
  }
}