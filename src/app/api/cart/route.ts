import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, getOrCreateGuestId, AuthError } from "@/lib/auth";
import { requireTenant, TenantNotFoundError, tenantNotFound } from "@/lib/tenant";

// Identify the user (logged in or guest)
async function getIdentifier(): Promise<{ userId: string; isGuest: boolean }> {
  try {
    const user = await getSessionUser();
    if (user) return { userId: user.id, isGuest: false };
  } catch {
    // Not authenticated
  }
  const guestId = await getOrCreateGuestId();
  return { userId: guestId, isGuest: true };
}

// GET /api/cart — fetch all cart items for the user/guest
export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant(req);
    const { userId } = await getIdentifier();

    const cartItems = await db.cartItem.findMany({
      where: { userId, tenantId: tenant.id },
      include: {
        product: { select: { name: true, price: true, image: true, category: { select: { name: true } }, badge: true, rating: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    return NextResponse.json({
      success: true,
      data: { items: cartItems, subtotal, itemCount: cartItems.reduce((s, i) => s + i.quantity, 0) },
    });
  } catch (error) {
    if (error instanceof TenantNotFoundError) {
      return tenantNotFound();
    }
    console.error("Cart GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch cart" }, { status: 500 });
  }
}

// POST /api/cart — add item to cart (or increment quantity)
export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant(req);
    const { userId } = await getIdentifier();
    const body = await req.json();
    const { productId, quantity = 1, addons } = body;

    if (!productId || typeof productId !== "number") {
      return NextResponse.json({ success: false, error: "Valid productId is required" }, { status: 400 });
    }

    // Verify product exists and is active
    const product = await db.product.findFirst({ where: { id: productId, tenantId: tenant.id, isActive: true } });
    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    // Upsert cart item
    const addonsStr = addons && addons.length > 0 ? JSON.stringify(addons) : null;

    const existing = await db.cartItem.findFirst({
      where: { userId, productId, tenantId: tenant.id },
    });

    let cartItem;
    if (existing) {
      cartItem = await db.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
        include: { product: { select: { name: true, price: true, image: true, badge: true, rating: true } } },
      });
    } else {
      cartItem = await db.cartItem.create({
        data: { userId, tenantId: tenant.id, productId, quantity, addons: addonsStr },
        include: { product: { select: { name: true, price: true, image: true, badge: true, rating: true } } },
      });
    }

    // Return updated cart summary
    const allItems = await db.cartItem.findMany({ where: { userId, tenantId: tenant.id }, include: { product: { select: { price: true } } } });
    const subtotal = allItems.reduce((s, i) => s + i.product.price * i.quantity, 0);

    return NextResponse.json({
      success: true,
      data: {
        item: cartItem,
        subtotal,
        itemCount: allItems.reduce((s, i) => s + i.quantity, 0),
      },
    });
  } catch (error) {
    if (error instanceof TenantNotFoundError) {
      return tenantNotFound();
    }
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error("Cart POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to add to cart" }, { status: 500 });
  }
}