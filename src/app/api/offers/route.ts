import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireTenant, TenantNotFoundError, tenantNotFound } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant(req);

    const offers = await db.offer.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ success: true, data: offers });
  } catch (error) {
    if (error instanceof TenantNotFoundError) {
      return tenantNotFound();
    }
    console.error("Offers API error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch offers" }, { status: 500 });
  }
}

// POST /api/offers/validate - validate a discount code
export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant(req);
    const { code, subtotal } = await req.json();

    if (!code || !code.trim()) {
      return NextResponse.json({ success: false, error: "Code is required" }, { status: 400 });
    }

    const offer = await db.offer.findFirst({
      where: { code: code.trim().toUpperCase(), tenantId: tenant.id, isActive: true },
    });

    if (!offer || !offer.isActive) {
      return NextResponse.json({ success: false, error: "Invalid or expired offer code" }, { status: 404 });
    }

    if (offer.validUntil && offer.validUntil < new Date()) {
      return NextResponse.json({ success: false, error: "This offer has expired" }, { status: 400 });
    }

    if (offer.minOrder > 0 && subtotal < offer.minOrder) {
      return NextResponse.json(
        { success: false, error: `Minimum order of Rs. ${offer.minOrder} required for this offer` },
        { status: 400 }
      );
    }

    let discountAmount = 0;
    let freeDelivery = false;

    if (offer.discountType === "percentage") {
      discountAmount = Math.round((subtotal * offer.discountValue) / 100);
    } else if (offer.discountType === "flat") {
      discountAmount = offer.discountValue;
    } else if (offer.discountType === "free_delivery") {
      freeDelivery = true;
    }

    return NextResponse.json({
      success: true,
      data: {
        code: offer.code,
        title: offer.title,
        discountType: offer.discountType,
        discountAmount,
        freeDelivery,
      },
    });
  } catch (error) {
    if (error instanceof TenantNotFoundError) {
      return tenantNotFound();
    }
    console.error("Offer validate error:", error);
    return NextResponse.json({ success: false, error: "Failed to validate offer" }, { status: 500 });
  }
}