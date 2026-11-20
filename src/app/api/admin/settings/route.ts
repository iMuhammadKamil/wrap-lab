import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readLocalDb, useLocalStore, writeLocalDb } from "@/lib/local-store";
import { invalidateTenantCache } from "@/lib/tenant";
import { requireAdmin, ok, fail, handleError, isValidHexColor } from "../_lib/helpers";

const SETTING_FIELDS = [
  "name",
  "tagline",
  "logo",
  "primaryColor",
  "secondaryColor",
  "phone",
  "email",
  "address",
  "whatsapp",
  "deliveryFee",
  "freeDeliveryThreshold",
  "currency",
  "isActive",
] as const;

// GET /api/admin/settings — tenant settings (slug included for display)
export async function GET() {
  try {
    const user = await requireAdmin();
    if (useLocalStore()) {
      const store = readLocalDb();
      const tenant = store.tenants.find((t) => t.id === user.tenantId);
      if (!tenant) return fail("Tenant not found", 404);
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...settings } = tenant;
      return ok(settings);
    }
    const tenant = await db.tenant.findUnique({ where: { id: user.tenantId } });
    if (!tenant) return fail("Tenant not found", 404);

    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...settings } = tenant;
    return ok(settings);
  } catch (error) {
    return handleError(error, "Failed to fetch settings");
  }
}

// PATCH /api/admin/settings — update tenant settings
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAdmin();
    const store = useLocalStore() ? readLocalDb() : null;
    const tenant = store
      ? store.tenants.find((t) => t.id === user.tenantId) ?? null
      : await db.tenant.findUnique({ where: { id: user.tenantId } });
    if (!tenant) return fail("Tenant not found", 404);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return fail("Invalid request body", 400);
    }

    const data: Record<string, unknown> = {};

    for (const field of SETTING_FIELDS) {
      if (body[field] === undefined) continue;

      switch (field) {
        case "name":
          if (typeof body.name !== "string" || !body.name.trim()) {
            return fail("Tenant name is required", 400);
          }
          data.name = body.name.trim();
          break;
        case "tagline":
          if (typeof body.tagline !== "string") return fail("Invalid tagline", 400);
          data.tagline = body.tagline.trim();
          break;
        case "logo":
          if (typeof body.logo !== "string") return fail("Invalid logo", 400);
          data.logo = body.logo.trim();
          break;
        case "primaryColor":
        case "secondaryColor":
          if (!isValidHexColor(body[field])) {
            return fail(`Invalid hex color for ${field}`, 400);
          }
          data[field] = body[field].toLowerCase();
          break;
        case "phone":
        case "email":
        case "address":
        case "whatsapp":
        case "currency":
          if (typeof body[field] !== "string") return fail(`Invalid ${field}`, 400);
          data[field] = body[field].trim();
          break;
        case "deliveryFee":
        case "freeDeliveryThreshold":
          if (typeof body[field] !== "number" || !Number.isFinite(body[field])) {
            return fail(`Invalid ${field}`, 400);
          }
          if (body[field] < 0) return fail(`${field} cannot be negative`, 400);
          data[field] = Math.round(body[field]);
          break;
        case "isActive":
          if (typeof body.isActive !== "boolean") return fail("Invalid isActive", 400);
          data.isActive = body.isActive;
          break;
      }
    }

    if (store) {
      const idx = store.tenants.findIndex((t) => t.id === user.tenantId);
      store.tenants[idx] = {
        ...store.tenants[idx],
        ...(data as Partial<(typeof store.tenants)[number]>),
        updatedAt: new Date().toISOString(),
      };
      writeLocalDb(store);
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...settings } = store.tenants[idx];
      return ok(settings);
    }

    const updated = await db.tenant.update({
      where: { id: user.tenantId },
      data,
    });
    invalidateTenantCache(updated.slug);

    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...settings } = updated;
    return ok(settings);
  } catch (error) {
    return handleError(error, "Failed to update settings");
  }
}