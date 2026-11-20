import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { getSessionUser, getOrCreateGuestId } from "@/lib/auth";
import { readLocalDb, useLocalStore, writeLocalDb } from "@/lib/local-store";
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

  if (useLocalStore()) {
    const store = readLocalDb();
    const matching = store.orders
      .filter((o) => o.tenantId === tenant.id && o.orderNumber.startsWith(prefix))
      .sort((a, b) => b.orderNumber.localeCompare(a.orderNumber));
    let seq = 1;
    if (matching.length > 0) {
      const parts = matching[0].orderNumber.split("-");
      seq = parseInt(parts[parts.length - 1], 10) + 1;
    }
    return `${prefix}-${String(seq).padStart(3, "0")}`;
  }

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

    if (useLocalStore()) {
      const store = readLocalDb();
      const orders = store.orders
        .filter((o) => o.userId === user.id && o.tenantId === tenant.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 20);
      return NextResponse.json({ success: true, data: orders });
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
    const { customerName, customerPhone, deliveryAddr, notes, paymentMethod, discountCode, items: clientItems } = body;

    // Validation
    if (!customerName?.trim()) {
      return NextResponse.json({ success: false, error: "Customer name is required" }, { status: 400 });
    }
    if (!customerPhone?.trim() || customerPhone.trim().length < 7) {
      return NextResponse.json({ success: false, error: "Valid phone number is required" }, { status: 400 });
    }
    if (!deliveryAddr?.trim()) {
      return NextResponse.json({ success: false, error: "Delivery address is required" }, { status: 400 });
    }

    if (useLocalStore()) {
      const store = readLocalDb();
      let cartItems = store.cartItems
        .filter((ci) => ci.userId === userId && ci.tenantId === tenant.id)
        .map((ci) => ({
          productId: ci.productId,
          quantity: ci.quantity,
          addons: ci.addons,
          product: store.products.find((p) => p.id === ci.productId && p.tenantId === tenant.id),
        }))
        .filter((ci) => Boolean(ci.product));

      if (cartItems.length === 0 && Array.isArray(clientItems) && clientItems.length > 0) {
        cartItems = clientItems
          .map((ci: { productId?: number; quantity?: number; addons?: string[] }) => ({
            productId: Number(ci.productId),
            quantity: Math.max(1, Number(ci.quantity) || 1),
            addons: Array.isArray(ci.addons) && ci.addons.length > 0 ? JSON.stringify(ci.addons) : null,
            product: store.products.find((p) => p.id === Number(ci.productId) && p.tenantId === tenant.id && p.isActive),
          }))
          .filter((ci) => Boolean(ci.product));
      }

      if (cartItems.length === 0) {
        return NextResponse.json({ success: false, error: "Cart is empty" }, { status: 400 });
      }

      const calcLine = (ci: (typeof cartItems)[number]) => {
        const p = ci.product!;
        let addonSum = 0;
        if (ci.addons) {
          try {
            const names = JSON.parse(ci.addons) as string[];
            addonSum = names.reduce((sum, n) => sum + (p.addons.find((a) => a.name === n)?.price ?? 0), 0);
          } catch { /* ignore */ }
        }
        return (p.price + addonSum) * ci.quantity;
      };

      const subtotal = cartItems.reduce((s, ci) => s + calcLine(ci), 0);
      let discountAmt = 0;
      let freeDelivery = false;
      if (discountCode?.trim()) {
        const offer = store.offers.find(
          (o) => o.code === discountCode.trim().toUpperCase() && o.tenantId === tenant.id && o.isActive
        );
        if (!offer) {
          return NextResponse.json({ success: false, error: "Invalid offer code" }, { status: 400 });
        }
        if (offer.validUntil && new Date(offer.validUntil) < new Date()) {
          return NextResponse.json({ success: false, error: "Offer code has expired" }, { status: 400 });
        }
        if (offer.minOrder > 0 && subtotal < offer.minOrder) {
          return NextResponse.json(
            { success: false, error: `Minimum order Rs. ${offer.minOrder} required for this offer` },
            { status: 400 }
          );
        }
        if (offer.discountType === "percentage") discountAmt = Math.round((subtotal * offer.discountValue) / 100);
        else if (offer.discountType === "flat") discountAmt = offer.discountValue;
        else if (offer.discountType === "free_delivery") freeDelivery = true;
      }

      const deliveryFee = freeDelivery || subtotal >= tenant.freeDeliveryThreshold ? 0 : tenant.deliveryFee;
      const total = Math.max(0, subtotal - discountAmt + deliveryFee);
      const orderNumber = await generateOrderNumber(tenant);
      const orderId = "ord-" + uuidv4().slice(0, 8);
      const now = new Date().toISOString();

      const orderItems = cartItems.map((ci) => ({
        id: store.nextId++,
        tenantId: tenant.id,
        orderId,
        productId: ci.productId,
        productName: ci.product!.name,
        productPrice: ci.product!.price,
        quantity: ci.quantity,
        addons: ci.addons,
        lineTotal: calcLine(ci),
      }));

      const newOrder = {
        id: orderId,
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
        estimatedMin: 35,
        createdAt: now,
        items: orderItems,
      };

      store.orders.push(newOrder);
      store.cartItems = store.cartItems.filter((ci) => !(ci.userId === userId && ci.tenantId === tenant.id));
      writeLocalDb(store);

      return NextResponse.json({
        success: true,
        data: {
          orderNumber: newOrder.orderNumber,
          total: newOrder.total,
          estimatedMin: newOrder.estimatedMin,
          status: newOrder.status,
        },
      });
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