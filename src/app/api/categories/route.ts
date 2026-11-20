import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { FALLBACK_CATEGORIES } from "@/lib/fallback-data";
import { readLocalDb, useLocalStore } from "@/lib/local-store";
import { requireTenant, TenantNotFoundError, tenantNotFound } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant(req);
    if (useLocalStore()) {
      const store = readLocalDb();
      const cats = store.categories
        .filter((c) => c.tenantId === tenant.id && c.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          sortOrder: c.sortOrder,
          _count: {
            products: store.products.filter((p) => p.tenantId === tenant.id && p.categoryId === c.id && p.isActive).length,
          },
        }));
      return NextResponse.json({ success: true, data: cats });
    }

    try {
      const categories = await db.category.findMany({
        where: { tenantId: tenant.id, isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          _count: {
            select: { products: { where: { isActive: true } } },
          },
        },
      });

      if (categories.length === 0 && FALLBACK_CATEGORIES[tenant.slug]) {
        return NextResponse.json({ success: true, data: FALLBACK_CATEGORIES[tenant.slug] });
      }

      return NextResponse.json({ success: true, data: categories });
    } catch {
      if (FALLBACK_CATEGORIES[tenant.slug]) {
        return NextResponse.json({ success: true, data: FALLBACK_CATEGORIES[tenant.slug] });
      }
      throw new Error("Failed to fetch categories");
    }
  } catch (error) {
    if (error instanceof TenantNotFoundError) {
      return tenantNotFound();
    }
    console.error("Categories API error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch categories" }, { status: 500 });
  }
}