import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const offers = await db.offer.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ success: true, data: offers });
  } catch (error) {
    console.error("Offers API error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch offers" }, { status: 500 });
  }
}

// POST /api/offers/validate - validate a discount code
export async function POST(req: Request) {
  try {
    const { code, subtotal } = await req.json();

    if (!code || !code.trim()) {
      return NextResponse.json({ success: false, error: "Code is required" }, { status: 400 });
    }

    const offer = await db.offer.findUnique({ where: { code: code.trim().toUpperCase() } });

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
    console.error("Offer validate error:", error);
    return NextResponse.json({ success: false, error: "Failed to validate offer" }, { status: 500 });
  }
}
