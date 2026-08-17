import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession, AuthError } from "@/lib/auth";
import { getTenantFromPath, TenantNotFoundError, tenantNotFound } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  try {
    const tenant = await getTenantFromPath(req);
    const { email, password } = await req.json();

    if (!email?.trim() || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
    }

    let user;
    if (tenant) {
      user = await db.user.findUnique({
        where: { tenantId_email: { tenantId: tenant.id, email: email.trim().toLowerCase() } },
      });
    } else {
      // Platform-level login (e.g. admin dashboard): email is unique per tenant,
      // so prefer an admin account when the same email exists under multiple tenants.
      const matches = await db.user.findMany({
        where: { email: email.trim().toLowerCase() },
        orderBy: { createdAt: "asc" },
      });
      user = matches.find((m) => m.role === "admin") ?? matches[0] ?? null;
    }

    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ success: false, error: "Account is deactivated" }, { status: 403 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    // Create session
    await createSession(user.id);

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        tenantId: user.tenantId,
      },
    });
  } catch (error) {
    if (error instanceof TenantNotFoundError) {
      return tenantNotFound();
    }
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    console.error("Login error:", error);
    return NextResponse.json({ success: false, error: "Login failed" }, { status: 500 });
  }
}