import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { hashPassword, createSession, AuthError } from "@/lib/auth";
import { readLocalDb, useLocalStore, writeLocalDb } from "@/lib/local-store";
import { requireTenant, TenantNotFoundError, tenantNotFound } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant(req);
    const { name, email, phone, password } = await req.json();

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ success: false, error: "Name, email, and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const emailLower = email.trim().toLowerCase();

    if (useLocalStore()) {
      const store = readLocalDb();
      const existing = store.users.find((u) => u.tenantId === tenant.id && u.email === emailLower);
      if (existing) {
        return NextResponse.json({ success: false, error: "An account with this email already exists" }, { status: 409 });
      }
      const passwordHash = await hashPassword(password);
      const user = {
        id: "user-" + uuidv4().slice(0, 8),
        tenantId: tenant.id,
        name: name.trim(),
        email: emailLower,
        phone: phone?.trim() || null,
        address: null,
        passwordHash,
        role: "customer",
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      store.users.push(user);
      writeLocalDb(store);
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
    }

    // Check if user exists (email unique per tenant)
    const existing = await db.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: emailLower } },
    });
    if (existing) {
      return NextResponse.json({ success: false, error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const user = await db.user.create({
      data: {
        tenantId: tenant.id,
        name: name.trim(),
        email: emailLower,
        phone: phone?.trim() || null,
        passwordHash,
      },
    });

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
    console.error("Register error:", error);
    return NextResponse.json({ success: false, error: "Registration failed" }, { status: 500 });
  }
}