import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await db.product.findUnique({
      where: { id: parseInt(id) },
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
      where: { categoryId: product.categoryId, isActive: true, id: { not: product.id } },
      take: 4,
      orderBy: { rating: "desc" },
      select: { id: true, name: true, price: true, badge: true, rating: true, image: true },
    });

    return NextResponse.json({ success: true, data: { ...product, related } });
  } catch (error) {
    console.error("Product detail API error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch product" }, { status: 500 });
  }
}
