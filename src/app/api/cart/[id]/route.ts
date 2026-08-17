import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, getOrCreateGuestId, AuthError } from "@/lib/auth";

async function getIdentifier(): Promise<string> {
  try {
    const user = await getSessionUser();
    if (user) return user.id;
  } catch {
    // Not authenticated
  }
  return await getOrCreateGuestId();
}

// PUT /api/cart/[id] — update quantity
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getIdentifier();
    const { quantity } = await req.json();

    if (typeof quantity !== "number" || quantity < 0) {
      return NextResponse.json({ success: false, error: "Invalid quantity" }, { status: 400 });
    }

    const cartItemId = parseInt(id);
    const existing = await db.cartItem.findUnique({ where: { id: cartItemId, userId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Cart item not found" }, { status: 404 });
    }

    if (quantity === 0) {
      await db.cartItem.delete({ where: { id: cartItemId } });
    } else {
      await db.cartItem.update({ where: { id: cartItemId }, data: { quantity } });
    }

    // Return updated cart
    const allItems = await db.cartItem.findMany({
      where: { userId },
      include: { product: { select: { name: true, price: true, image: true, badge: true, rating: true } } },
    });
    const subtotal = allItems.reduce((s, i) => s + i.product.price * i.quantity, 0);

    return NextResponse.json({
      success: true,
      data: { items: allItems, subtotal, itemCount: allItems.reduce((s, i) => s + i.quantity, 0) },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error("Cart PUT error:", error);
    return NextResponse.json({ success: false, error: "Failed to update cart" }, { status: 500 });
  }
}

// DELETE /api/cart/[id] — remove item
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getIdentifier();
    const cartItemId = parseInt(id);

    const existing = await db.cartItem.findUnique({ where: { id: cartItemId, userId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Cart item not found" }, { status: 404 });
    }

    await db.cartItem.delete({ where: { id: cartItemId } });

    const allItems = await db.cartItem.findMany({
      where: { userId },
      include: { product: { select: { name: true, price: true, image: true, badge: true, rating: true } } },
    });
    const subtotal = allItems.reduce((s, i) => s + i.product.price * i.quantity, 0);

    return NextResponse.json({
      success: true,
      data: { items: allItems, subtotal, itemCount: allItems.reduce((s, i) => s + i.quantity, 0) },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error("Cart DELETE error:", error);
    return NextResponse.json({ success: false, error: "Failed to remove cart item" }, { status: 500 });
  }
}
