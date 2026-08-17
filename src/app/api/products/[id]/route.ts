import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireTenant, TenantNotFoundError, tenantNotFound } from "@/lib/tenant";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await requireTenant(req);
    const { id } = await params;
    const product = await db.product.findFirst({
      where: { id: parseInt(id), tenantId: tenant.id },
      include: {
        category: { select: { name: true, icon: true } },
        addons: { select: { name: true, price: true }, orderBy: { name: "asc" } },
      },
    });

    if (!product || !product.isActive) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    // Get related products (same category, exclude current)
    const related = await db.product.findMany({
      where: { tenantId: tenant.id, categoryId: product.categoryId, isActive: true, id: { not: product.id } },
      take: 4,
      orderBy: { rating: "desc" },
      select: { id: true, name: true, price: true, badge: true, rating: true, image: true },
    });

    return NextResponse.json({ success: true, data: { ...product, related } });
  } catch (error) {
    if (error instanceof TenantNotFoundError) {
      return tenantNotFound();
    }
    console.error("Product detail API error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch product" }, { status: 500 });
  }
}