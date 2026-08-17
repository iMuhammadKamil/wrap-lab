import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Tenant } from "@prisma/client";

const tenantCache = new Map<string, Tenant>();

export function tenantNotFound(): NextResponse {
  return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 });
}

export class TenantNotFoundError extends Error {
  status = 404;
  constructor() {
    super("Tenant not found");
    this.name = "TenantNotFoundError";
  }
}

export async function getTenantFromPath(req: NextRequest): Promise<Tenant | null> {
  const headerSlug = req.headers.get("x-tenant-slug");
  if (headerSlug) return getTenantBySlug(headerSlug);
  const segments = req.nextUrl.pathname.split("/");
  if (segments.length < 2 || segments[1] === "api") return null;
  return getTenantBySlug(segments[1]);
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const cached = tenantCache.get(slug);
  if (cached) return cached;
  const tenant = await db.tenant.findFirst({ where: { slug, isActive: true } });
  if (tenant) tenantCache.set(slug, tenant);
  return tenant;
}

export async function requireTenant(req: NextRequest): Promise<Tenant> {
  const tenant = await getTenantFromPath(req);
  if (!tenant) throw new TenantNotFoundError();
  return tenant;
}