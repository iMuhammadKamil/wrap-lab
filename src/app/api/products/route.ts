import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireTenant, TenantNotFoundError, tenantNotFound } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant(req);
    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = { tenantId: tenant.id, isActive: true };

    if (category && category !== "All") {
      where.category = { name: category };
    }

    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const products = await db.product.findMany({
      where,
      include: {
        category: { select: { name: true, icon: true } },
        addons: { select: { name: true, price: true }, orderBy: { name: "asc" } },
      },
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    if (error instanceof TenantNotFoundError) {
      return tenantNotFound();
    }
    console.error("Products API error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch products" }, { status: 500 });
  }
}