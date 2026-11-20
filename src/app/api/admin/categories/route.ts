import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readLocalDb, useLocalStore, writeLocalDb } from "@/lib/local-store";
import { requireAdmin, ok, fail, handleError, stripTenantId, isPrismaDuplicate } from "../_lib/helpers";

// GET /api/admin/categories — all tenant categories with product counts
export async function GET() {
  try {
    const user = await requireAdmin();
    if (useLocalStore()) {
      const store = readLocalDb();
      const categories = store.categories
        .filter((c) => c.tenantId === user.tenantId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((c) => ({
          ...c,
          _count: {
            products: store.products.filter((p) => p.tenantId === user.tenantId && p.categoryId === c.id).length,
          },
        }));
      return ok(categories);
    }
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

    const icon = typeof body.icon === "string" && body.icon.trim() ? body.icon.trim() : "🍽️";
    const sortOrder = typeof body.sortOrder === "number" ? Math.round(body.sortOrder) : 0;

    if (useLocalStore()) {
      const store = readLocalDb();
      if (store.categories.some((c) => c.tenantId === user.tenantId && c.name === name)) {
        return fail("A category with this name already exists", 409);
      }
      const category = {
        id: store.nextId++,
        tenantId: user.tenantId,
        name,
        icon,
        sortOrder,
        isActive: true,
      };
      store.categories.push(category);
      writeLocalDb(store);
      return ok({ ...category, _count: { products: 0 } }, 201);
    }

    const existing = await db.category.findFirst({
      where: { tenantId: user.tenantId, name },
    });
    if (existing) return fail("A category with this name already exists", 409);

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