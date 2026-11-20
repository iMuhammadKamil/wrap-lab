import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { FALLBACK_PRODUCTS } from "@/lib/fallback-data";
import { readLocalDb, useLocalStore } from "@/lib/local-store";
import { requireTenant, TenantNotFoundError, tenantNotFound } from "@/lib/tenant";

function filterFallbackProducts(slug: string, category: string | null, search: string | null) {
  let items = FALLBACK_PRODUCTS[slug] ?? [];
  if (category && category !== "All") {
    items = items.filter((p) => p.category.name === category);
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    items = items.filter(
      (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }
  return items;
}

export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant(req);
    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    if (useLocalStore()) {
      const store = readLocalDb();
      const catMap = new Map(store.categories.map((c) => [c.id, c]));
      let items = store.products
        .filter((p) => p.tenantId === tenant.id && p.isActive)
        .map((p) => {
          const cat = catMap.get(p.categoryId);
          return {
            ...p,
            category: { name: cat?.name ?? "Menu", icon: cat?.icon ?? "🍽️" },
          };
        });
      if (category && category !== "All") {
        items = items.filter((p) => p.category.name === category);
      }
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        items = items.filter(
          (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
        );
      }
      return NextResponse.json({ success: true, data: items });
    }

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

    try {
      const products = await db.product.findMany({
        where,
        include: {
          category: { select: { name: true, icon: true } },
          addons: { select: { name: true, price: true }, orderBy: { name: "asc" } },
        },
        orderBy: { id: "asc" },
      });

      if (products.length === 0 && !search?.trim() && (!category || category === "All") && FALLBACK_PRODUCTS[tenant.slug]) {
        return NextResponse.json({ success: true, data: filterFallbackProducts(tenant.slug, category, search) });
      }

      return NextResponse.json({ success: true, data: products });
    } catch {
      if (FALLBACK_PRODUCTS[tenant.slug]) {
        return NextResponse.json({ success: true, data: filterFallbackProducts(tenant.slug, category, search) });
      }
      throw new Error("Failed to fetch products");
    }
  } catch (error) {
    if (error instanceof TenantNotFoundError) {
      return tenantNotFound();
    }
    console.error("Products API error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch products" }, { status: 500 });
  }
}