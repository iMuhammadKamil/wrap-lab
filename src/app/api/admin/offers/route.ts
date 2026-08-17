import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  requireAdmin,
  ok,
  fail,
  handleError,
  stripTenantId,
  isPrismaDuplicate,
  OFFER_TYPES,
} from "../_lib/helpers";

// GET /api/admin/offers — all tenant offers (incl. inactive)
export async function GET() {
  try {
    const user = await requireAdmin();
    const offers = await db.offer.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { id: "desc" },
    });

    return ok(offers.map(stripTenantId));
  } catch (error) {
    return handleError(error, "Failed to fetch offers");
  }
}

// POST /api/admin/offers — create offer
export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin();
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return fail("Invalid request body", 400);
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return fail("Offer title is required", 400);

    const code =
      typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    if (!code) return fail("Offer code is required", 400);

    const existing = await db.offer.findFirst({
      where: { tenantId: user.tenantId, code },
    });
    if (existing) return fail("An offer with this code already exists", 409);

    const discountType = body.discountType ?? "percentage";
    if (!OFFER_TYPES.includes(discountType as (typeof OFFER_TYPES)[number])) {
      return fail("Invalid discount type", 400);
    }

    const discountValue =
      typeof body.discountValue === "number" && Number.isFinite(body.discountValue)
        ? Math.round(body.discountValue)
        : 0;
    if (discountValue < 0) return fail("Discount value cannot be negative", 400);

    const minOrder =
      typeof body.minOrder === "number" && Number.isFinite(body.minOrder)
        ? Math.round(body.minOrder)
        : 0;
    if (minOrder < 0) return fail("Minimum order cannot be negative", 400);

    let validUntil: Date | null = null;
    if (body.validUntil) {
      const d = new Date(body.validUntil as string);
      if (Number.isNaN(d.getTime())) return fail("Invalid expiry date", 400);
      validUntil = d;
    }

    const description = typeof body.description === "string" ? body.description.trim() : "";
    const icon = typeof body.icon === "string" && body.icon.trim() ? body.icon.trim() : "🎁";

    const offer = await db.offer.create({
      data: {
        tenantId: user.tenantId,
        title,
        description,
        code,
        icon,
        discountType: discountType as string,
        discountValue,
        minOrder,
        validUntil,
      },
    });

    return ok(stripTenantId(offer), 201);
  } catch (error) {
    if (isPrismaDuplicate(error)) {
      return fail("An offer with this code already exists", 409);
    }
    return handleError(error, "Failed to create offer");
  }
}