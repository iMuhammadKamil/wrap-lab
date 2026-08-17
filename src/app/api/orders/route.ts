import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, getOrCreateGuestId } from "@/lib/auth";
import { requireTenant, TenantNotFoundError, tenantNotFound } from "@/lib/tenant";
import type { Tenant } from "@prisma/client";

// Order number like WL-20260816-001 — prefix derived from tenant slug
// (shawarma-palace -> SP). Single-word slugs (wraplab) take the first letters
// of the tenant name words so the legacy WL- prefix is preserved.
function orderPrefixForTenant(tenant: Tenant): string {
  const slugWords = tenant.slug.split("-").filter(Boolean);
  if (slugWords.length > 1) {
    return slugWords.map((w) => w.charAt(0).toUpperCase()).join("");
  }
  const nameWords = tenant.name.split(/\s+/).filter(Boolean);
  return (slugWords[0].charAt(0) + (nameWords[1]?.charAt(0) ?? "")).toUpperCase();
}

async function generateOrderNumber(tenant: Tenant): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `${orderPrefixForTenant(tenant)}-${dateStr}`;

  const lastOrder = await db.order.findFirst({
    where: { tenantId: tenant.id, orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: "desc" },
  });

  let seq = 1;
  if (lastOrder) {
    const parts = lastOrder.orderNumber.split("-");
    seq = parseInt(parts[parts.length - 1]) + 1;
  }

  return `${prefix}-${String(seq).padStart(3, "0")}`;
}

// GET /api/orders — list orders for the current user
export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant(req);
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Login required to view orders" }, { status: 401 });
    }

    const orders = await db.order.findMany({
      where: { userId: user.id, tenantId: tenant.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    if (error instanceof TenantNotFoundError) {
      return tenantNotFound();
    }
    console.error("Orders GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch orders" }, { status: 500 });
  }
}

// POST /api/orders — create a new order
export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant(req);
    const user = await getSessionUser();
    const guestId = await getOrCreateGuestId();
    const userId = user ? user.id : guestId;

    const body = await req.json();
    const { customerName, customerPhone, deliveryAddr, notes, paymentMethod, discountCode } = body;

    // Validation
    if (!customerName?.trim()) {
      return NextResponse.json({ success: false, error: "Customer name is required" }, { status: 400 });
    }
    if (!customerPhone?.trim() || customerPhone.length < 10) {
      return NextResponse.json({ success: false, error: "Valid phone number is required" }, { status: 400 });
    }
    if (!deliveryAddr?.trim()) {
      return NextResponse.json({ success: false, error: "Delivery address is required" }, { status: 400 });
    }

    // Fetch cart items
    const cartItems = await db.cartItem.findMany({
      where: { userId, tenantId: tenant.id },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return NextResponse.json({ success: false, error: "Cart is empty" }, { status: 400 });
    }

    // Calculate subtotal
    const subtotal = cartItems.reduce((s, ci) => s + ci.product.price * ci.quantity, 0);

    // Apply discount if code provided
    let discountAmt = 0;
    let freeDelivery = false;
    if (discountCode?.trim()) {
      const offer = await db.offer.findFirst({
        where: { code: discountCode.trim().toUpperCase(), tenantId: tenant.id, isActive: true },
      });
      if (offer) {
        if (offer.validUntil && offer.validUntil < new Date()) {
          return NextResponse.json({ success: false, error: "Offer code has expired" }, { status: 400 });
        }
        if (offer.minOrder > 0 && subtotal < offer.minOrder) {
          return NextResponse.json(
            { success: false, error: `Minimum order Rs. ${offer.minOrder} required for this offer` },
            { status: 400 }
          );
        }
        if (offer.discountType === "percentage") {
          discountAmt = Math.round((subtotal * offer.discountValue) / 100);
        } else if (offer.discountType === "flat") {
          discountAmt = offer.discountValue;
        } else if (offer.discountType === "free_delivery") {
          freeDelivery = true;
        }
      } else {
        return NextResponse.json({ success: false, error: "Invalid offer code" }, { status: 400 });
      }
    }

    // Delivery fee from tenant config
    const deliveryFee = freeDelivery || subtotal >= tenant.freeDeliveryThreshold ? 0 : tenant.deliveryFee;
    const total = subtotal - discountAmt + deliveryFee;

    // Generate order number
    const orderNumber = await generateOrderNumber(tenant);

    // Create order with items in a transaction
    const order = await db.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          tenantId: tenant.id,
          userId,
          orderNumber,
          status: "pending",
          paymentMethod: paymentMethod || "cod",
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          deliveryAddr: deliveryAddr.trim(),
          notes: notes?.trim() || null,
          subtotal,
          deliveryFee,
          discountCode: discountCode?.trim().toUpperCase() || null,
          discountAmt,
          total,
        },
      });

      // Create order items
      for (const ci of cartItems) {
        const lineTotal = ci.product.price * ci.quantity;
        await tx.orderItem.create({
          data: {
            tenantId: tenant.id,
            orderId: newOrder.id,
            productId: ci.productId,
            productName: ci.product.name,
            productPrice: ci.product.price,
            quantity: ci.quantity,
            addons: ci.addons,
            lineTotal,
          },
        });
      }

      // Clear the cart
      await tx.cartItem.deleteMany({ where: { userId, tenantId: tenant.id } });

      return newOrder;
    });

    // If guest, optionally create/register user? For now just return order.
    return NextResponse.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        total: order.total,
        estimatedMin: order.estimatedMin,
        status: order.status,
      },
    });
  } catch (error) {
    if (error instanceof TenantNotFoundError) {
      return tenantNotFound();
    }
    console.error("Order POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to place order" }, { status: 500 });
  }
}