import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, ok, fail, handleError, stripTenantId, isPrismaDuplicate } from "../_lib/helpers";

// GET /api/admin/categories — all tenant categories with product counts
export async function GET() {
  try {
    const user = await requireAdmin();
    const categories = await db.category.findMany({
      where: { tenantId: user.tenantId },
      include: { _count: { select: { products: true } } },
      orderBy: { sortOrder: "asc" },
    });

    return ok(categories.map(stripTenantId));
  } catch (error) {
    return handleError(error, "Failed to fetch categories");
  }
}

// POST /api/admin/categories — create category
export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return fail("Invalid request body", 400);
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return fail("Category name is required", 400);

    const existing = await db.category.findFirst({
      where: { tenantId: user.tenantId, name },
    });
    if (existing) return fail("A category with this name already exists", 409);

    const icon = typeof body.icon === "string" && body.icon.trim() ? body.icon.trim() : "🍽️";
    const sortOrder = typeof body.sortOrder === "number" ? Math.round(body.sortOrder) : 0;

    const category = await db.category.create({
      data: { tenantId: user.tenantId, name, icon, sortOrder },
      include: { _count: { select: { products: true } } },
    });

    return ok(stripTenantId(category), 201);
  } catch (error) {
    if (isPrismaDuplicate(error)) {
      return fail("A category with this name already exists", 409);
    }
    return handleError(error, "Failed to create category");
  }
}