import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, ok, fail, handleError, stripTenantId, parseIntParam, isPrismaDuplicate } from "../../_lib/helpers";

// PATCH /api/admin/categories/[id] — update category
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    const { id } = await params;
    const categoryId = parseIntParam(id);
    if (categoryId === null) return fail("Invalid category id", 400);

    const existing = await db.category.findFirst({
      where: { id: categoryId, tenantId: user.tenantId },
    });
    if (!existing) return fail("Category not found", 404);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return fail("Invalid request body", 400);
    }

    const data: { name?: string; icon?: string; sortOrder?: number; isActive?: boolean } = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return fail("Category name is required", 400);
      }
      const name = body.name.trim();
      const dup = await db.category.findFirst({
        where: { tenantId: user.tenantId, name, id: { not: categoryId } },
      });
      if (dup) return fail("A category with this name already exists", 409);
      data.name = name;
    }
    if (body.icon !== undefined) {
      if (typeof body.icon !== "string") return fail("Invalid icon", 400);
      data.icon = body.icon.trim() || "🍽️";
    }
    if (body.sortOrder !== undefined) {
      if (typeof body.sortOrder !== "number" || !Number.isFinite(body.sortOrder)) {
        return fail("Invalid sort order", 400);
      }
      data.sortOrder = Math.round(body.sortOrder);
    }
    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") return fail("Invalid isActive", 400);
      data.isActive = body.isActive;
    }

    const category = await db.category.update({
      where: { id: categoryId },
      data,
      include: { _count: { select: { products: true } } },
    });

    return ok(stripTenantId(category));
  } catch (error) {
    if (isPrismaDuplicate(error)) {
      return fail("A category with this name already exists", 409);
    }
    return handleError(error, "Failed to update category");
  }
}

// DELETE /api/admin/categories/[id] — soft delete (isActive=false)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    const { id } = await params;
    const categoryId = parseIntParam(id);
    if (categoryId === null) return fail("Invalid category id", 400);

    const existing = await db.category.findFirst({
      where: { id: categoryId, tenantId: user.tenantId },
    });
    if (!existing) return fail("Category not found", 404);

    const category = await db.category.update({
      where: { id: categoryId },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });

    return ok(category);
  } catch (error) {
    return handleError(error, "Failed to delete category");
  }
}