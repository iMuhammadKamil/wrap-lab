import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readLocalDb, useLocalStore, writeLocalDb } from "@/lib/local-store";
import { requireAdmin, ok, fail, handleError, stripTenantId, isPrismaDuplicate } from "../_lib/helpers";

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

// GET /api/admin/products — all tenant products (incl. inactive), with category + addons
export async function GET() {
  try {
    const user = await requireAdmin();
    if (useLocalStore()) {
      const store = readLocalDb();
      const catMap = new Map(store.categories.map((c) => [c.id, c]));
      const products = store.products
        .filter((p) => p.tenantId === user.tenantId)
        .sort((a, b) => b.id - a.id)
        .map((p) => {
          const cat = catMap.get(p.categoryId);
          return {
            ...p,
            category: cat ? { id: cat.id, name: cat.name, icon: cat.icon } : { id: p.categoryId, name: "Menu", icon: "🍽️" },
          };
        });
      return ok(products);
    }
    const products = await db.product.findMany({
      where: { tenantId: user.tenantId },
      include: {
        category: { select: { id: true, name: true, icon: true } },
        addons: { select: { id: true, name: true, price: true }, orderBy: { id: "asc" } },
      },
      orderBy: { id: "desc" },
    });

    return ok(products.map(stripTenantId));
  } catch (error) {
    return handleError(error, "Failed to fetch products");
  }
}

// POST /api/admin/products — create product
export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return fail("Invalid request body", 400);
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return fail("Product name is required", 400);

    const price = body.price;
    if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
      return fail("Valid product price is required", 400);
    }

    const categoryId = body.categoryId;
    if (typeof categoryId !== "number" || !Number.isInteger(categoryId)) {
      return fail("Valid category is required", 400);
    }

    const addons = body.addons !== undefined ? validateAddons(body.addons) : [];
    if (addons === null) return fail("Invalid addons", 400);

    const rating = typeof body.rating === "number" ? Math.max(0, Math.min(5, body.rating)) : 4.0;
    const badge = typeof body.badge === "string" && body.badge.trim() ? body.badge.trim() : null;
    const image = typeof body.image === "string" ? body.image.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";

    if (useLocalStore()) {
      const store = readLocalDb();
      const cat = store.categories.find((c) => c.id === categoryId && c.tenantId === user.tenantId);
      if (!cat) return fail("Category not found", 400);
      const product = {
        id: store.nextId++,
        tenantId: user.tenantId,
        name,
        description,
        price: Math.round(price),
        image,
        categoryId,
        badge,
        rating,
        isActive: true,
        addons: addons.map((a) => ({
          id: store.nextId++,
          name: a.name as string,
          price: a.price as number,
        })),
      };
      store.products.push(product);
      writeLocalDb(store);
      return ok({ ...product, category: { id: cat.id, name: cat.name, icon: cat.icon } }, 201);
    }

    const category = await db.category.findFirst({
      where: { id: categoryId, tenantId: user.tenantId },
    });
    if (!category) return fail("Category not found", 400);

    const product = await db.product.create({
      data: {
        tenantId: user.tenantId,
        name,
        description,
        price: Math.round(price),
        image,
        categoryId,
        badge,
        rating,
        addons: addons.length
          ? {
              create: addons.map((a) => ({
                tenantId: user.tenantId,
                name: a.name as string,
                price: a.price as number,
              })),
            }
          : undefined,
      },
      include: {
        category: { select: { id: true, name: true, icon: true } },
        addons: { select: { id: true, name: true, price: true }, orderBy: { id: "asc" } },
      },
    });

    return ok(stripTenantId(product), 201);
  } catch (error) {
    if (isPrismaDuplicate(error)) {
      return fail("A product with this name already exists in this category", 409);
    }
    return handleError(error, "Failed to create product");
  }
}