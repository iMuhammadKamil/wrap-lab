import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantFromPath, tenantNotFound } from "@/lib/tenant";

// Public tenant config endpoint.
//
// Two modes on the same route:
//   1. Tenant config:  GET /{slug}/api/tenant  (rewritten by middleware to /api/tenant
//      with the slug forwarded via the x-tenant-slug header). Returns the full public
//      branding/config payload for that tenant.
//   2. Tenant directory: GET /api/tenant (platform level, no slug resolved). Returns a
//      lightweight list of all active tenants, used by the platform landing page.
export async function GET(req: NextRequest) {
  try {
    const tenant = await getTenantFromPath(req);

    const slugAttempted =
      !!req.headers.get("x-tenant-slug") ||
      (req.nextUrl.pathname.split("/").filter(Boolean)[0] ?? "") !== "api";

    // A slug was requested but the tenant is missing or inactive -> 404.
    if (!tenant && slugAttempted) {
      return tenantNotFound();
    }

    // Platform-level directory: no slug in play.
    if (!tenant) {
      const tenants = await db.tenant.findMany({
        where: { isActive: true },
        select: {
          id: true,
          slug: true,
          name: true,
          tagline: true,
          logo: true,
          primaryColor: true,
          phone: true,
          address: true,
          deliveryFee: true,
          freeDeliveryThreshold: true,
          currency: true,
        },
        orderBy: { name: "asc" },
      });
      return NextResponse.json({ success: true, data: tenants });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        logo: tenant.logo,
        tagline: tenant.tagline,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
        phone: tenant.phone,
        email: tenant.email,
        address: tenant.address,
        whatsapp: tenant.whatsapp,
        deliveryFee: tenant.deliveryFee,
        freeDeliveryThreshold: tenant.freeDeliveryThreshold,
        currency: tenant.currency,
        isActive: tenant.isActive,
      },
    });
  } catch (error) {
    console.error("Tenant API error:", error);
    return NextResponse.json({ success: false, error: "Failed to load tenant" }, { status: 500 });
  }
}