import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  requireAdmin,
  ok,
  fail,
  handleError,
  stripTenantId,
  parseIntParam,
  isPrismaDuplicate,
  OFFER_TYPES,
} from "../../_lib/helpers";

// PATCH /api/admin/offers/[id] — update offer
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    const { id } = await params;
    const offerId = parseIntParam(id);
    if (offerId === null) return fail("Invalid offer id", 400);

    const existing = await db.offer.findFirst({
      where: { id: offerId, tenantId: user.tenantId },
    });
    if (!existing) return fail("Offer not found", 404);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return fail("Invalid request body", 400);
    }

    const data: {
      title?: string;
      description?: string;
      code?: string;
      icon?: string;
      discountType?: string;
      discountValue?: number;
      minOrder?: number;
      validUntil?: Date | null;
      isActive?: boolean;
    } = {};

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || !body.title.trim()) {
        return fail("Offer title is required", 400);
      }
      data.title = body.title.trim();
    }
    if (body.description !== undefined) {
      if (typeof body.description !== "string") return fail("Invalid description", 400);
      data.description = body.description.trim();
    }
    if (body.code !== undefined) {
      if (typeof body.code !== "string" || !body.code.trim()) {
        return fail("Offer code is required", 400);
      }
      const code = body.code.trim().toUpperCase();
      const dup = await db.offer.findFirst({
        where: { tenantId: user.tenantId, code, id: { not: offerId } },
      });
      if (dup) return fail("An offer with this code already exists", 409);
      data.code = code;
    }
    if (body.icon !== undefined) {
      if (typeof body.icon !== "string") return fail("Invalid icon", 400);
      data.icon = body.icon.trim() || "🎁";
    }
    if (body.discountType !== undefined) {
      if (!OFFER_TYPES.includes(body.discountType as (typeof OFFER_TYPES)[number])) {
        return fail("Invalid discount type", 400);
      }
      data.discountType = body.discountType;
    }
    if (body.discountValue !== undefined) {
      if (typeof body.discountValue !== "number" || !Number.isFinite(body.discountValue)) {
        return fail("Invalid discount value", 400);
      }
      if (body.discountValue < 0) return fail("Discount value cannot be negative", 400);
      data.discountValue = Math.round(body.discountValue);
    }
    if (body.minOrder !== undefined) {
      if (typeof body.minOrder !== "number" || !Number.isFinite(body.minOrder)) {
        return fail("Invalid minimum order", 400);
      }
      if (body.minOrder < 0) return fail("Minimum order cannot be negative", 400);
      data.minOrder = Math.round(body.minOrder);
    }
    if (body.validUntil !== undefined) {
      if (body.validUntil === null) {
        data.validUntil = null;
      } else {
        const d = new Date(body.validUntil as string);
        if (Number.isNaN(d.getTime())) return fail("Invalid expiry date", 400);
        data.validUntil = d;
      }
    }
    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") return fail("Invalid isActive", 400);
      data.isActive = body.isActive;
    }

    const offer = await db.offer.update({
      where: { id: offerId },
      data,
    });

    return ok(stripTenantId(offer));
  } catch (error) {
    if (isPrismaDuplicate(error)) {
      return fail("An offer with this code already exists", 409);
    }
    return handleError(error, "Failed to update offer");
  }
}

// DELETE /api/admin/offers/[id] — soft delete (isActive=false)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    const { id } = await params;
    const offerId = parseIntParam(id);
    if (offerId === null) return fail("Invalid offer id", 400);

    const existing = await db.offer.findFirst({
      where: { id: offerId, tenantId: user.tenantId },
    });
    if (!existing) return fail("Offer not found", 404);

    const offer = await db.offer.update({
      where: { id: offerId },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });

    return ok(offer);
  } catch (error) {
    return handleError(error, "Failed to delete offer");
  }
}