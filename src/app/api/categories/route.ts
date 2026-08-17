import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireTenant, TenantNotFoundError, tenantNotFound } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant(req);

    const categories = await db.category.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    if (error instanceof TenantNotFoundError) {
      return tenantNotFound();
    }
    console.error("Categories API error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch categories" }, { status: 500 });
  }
}