import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, ok, fail, handleError, stripTenantId, parseIntParam } from "../../_lib/helpers";

type AddonInput = { name?: unknown; price?: unknown };

function validateAddons(addons: unknown): AddonInput[] | null {
  if (!Array.isArray(addons)) return null;
  const clean: AddonInput[] = [];
  for (const a of addons) {
    if (typeof a !== "object" || a === null) return null;
    const name = (a as AddonInput).name;
    const price = (a as AddonInput).price;
    if (typeof name !== "string" || !name.trim()) return null;
    if (typeof price !== "number" || !Number.isFinite(price) || price < 0) return null;
    clean.push({ name: name.trim(), price: Math.round(price) });
  }
  return clean;
}

// PATCH /api/admin/products/[id] — update product fields + replace addons
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    const { id } = await params;
    const productId = parseIntParam(id);
    if (productId === null) return fail("Invalid product id", 400);

    const existing = await db.product.findFirst({
      where: { id: productId, tenantId: user.tenantId },
    });
    if (!existing) return fail("Product not found", 404);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return fail("Invalid request body", 400);
    }

    const data: {
      name?: string;
      description?: string;
      price?: number;
      image?: string;
      categoryId?: number;
      badge?: string | null;
      rating?: number;
      isActive?: boolean;
    } = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return fail("Product name is required", 400);
      }
      data.name = body.name.trim();
    }
    if (body.description !== undefined) {
      if (typeof body.description !== "string") return fail("Invalid description", 400);
      data.description = body.description.trim();
    }
    if (body.price !== undefined) {
      if (typeof body.price !== "number" || !Number.isFinite(body.price) || body.price < 0) {
        return fail("Valid product price is required", 400);
      }
      data.price = Math.round(body.price);
    }
    if (body.image !== undefined) {
      if (typeof body.image !== "string") return fail("Invalid image", 400);
      data.image = body.image.trim();
    }
    if (body.categoryId !== undefined) {
      if (typeof body.categoryId !== "number" || !Number.isInteger(body.categoryId)) {
        return fail("Valid category is required", 400);
      }
      const category = await db.category.findFirst({
        where: { id: body.categoryId, tenantId: user.tenantId },
      });
      if (!category) return fail("Category not found", 400);
      data.categoryId = body.categoryId;
    }
    if (body.badge !== undefined) {
      data.badge = typeof body.badge === "string" && body.badge.trim() ? body.badge.trim() : null;
    }
    if (body.rating !== undefined) {
      if (typeof body.rating !== "number" || !Number.isFinite(body.rating)) {
        return fail("Invalid rating", 400);
      }
      data.rating = Math.max(0, Math.min(5, body.rating));
    }
    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") return fail("Invalid isActive", 400);
      data.isActive = body.isActive;
    }

    const addons = body.addons !== undefined ? validateAddons(body.addons) : null;
    if (body.addons !== undefined && addons === null) return fail("Invalid addons", 400);

    const product = await db.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: productId },
        data,
        include: {
          category: { select: { id: true, name: true, icon: true } },
          addons: { select: { id: true, name: true, price: true }, orderBy: { id: "asc" } },
        },
      });

      if (addons !== null) {
        await tx.productAddon.deleteMany({
          where: { productId, tenantId: user.tenantId },
        });
        if (addons.length) {
          await tx.productAddon.createMany({
            data: addons.map((a) => ({
              tenantId: user.tenantId,
              productId,
              name: a.name as string,
              price: a.price as number,
            })),
          });
        }
        return tx.product.findUniqueOrThrow({
          where: { id: productId },
          include: {
            category: { select: { id: true, name: true, icon: true } },
            addons: { select: { id: true, name: true, price: true }, orderBy: { id: "asc" } },
          },
        });
      }
      return updated;
    });

    return ok(stripTenantId(product));
  } catch (error) {
    return handleError(error, "Failed to update product");
  }
}

// DELETE /api/admin/products/[id] — soft delete (isActive=false)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    const { id } = await params;
    const productId = parseIntParam(id);
    if (productId === null) return fail("Invalid product id", 400);

    const existing = await db.product.findFirst({
      where: { id: productId, tenantId: user.tenantId },
    });
    if (!existing) return fail("Product not found", 404);

    const product = await db.product.update({
      where: { id: productId },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });

    return ok(product);
  } catch (error) {
    return handleError(error, "Failed to delete product");
  }
}