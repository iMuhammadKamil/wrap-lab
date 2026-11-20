import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { readLocalDb, useLocalStore, writeLocalDb } from "@/lib/local-store";

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
const RESERVED_SLUGS = new Set(["admin", "api", "signup", "login", "images", "favicon"]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { restaurantName, slug, name, email, password, phone, address, primaryColor, tagline, logo } = body;

    if (!restaurantName || typeof restaurantName !== "string" || restaurantName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Restaurant name must be at least 2 characters" },
        { status: 400 }
      );
    }

    const slugTrimmed = typeof slug === "string" ? slug.trim().toLowerCase() : "";
    if (
      slugTrimmed.length < 3 ||
      slugTrimmed.length > 30 ||
      !SLUG_REGEX.test(slugTrimmed) ||
      RESERVED_SLUGS.has(slugTrimmed)
    ) {
      return NextResponse.json(
        { success: false, error: "Web address must be 3-30 characters, not a reserved word, and use only lowercase letters, numbers, and hyphens" },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ success: false, error: "Owner name is required" }, { status: 400 });
    }

    const emailLower = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!emailLower || !EMAIL_REGEX.test(emailLower)) {
      return NextResponse.json({ success: false, error: "A valid email is required" }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters" }, { status: 400 });
    }

    if (useLocalStore()) {
      const store = readLocalDb();
      if (store.tenants.some((t) => t.slug === slugTrimmed)) {
        return NextResponse.json({ success: false, error: "That web address is already taken" }, { status: 409 });
      }
      const passwordHash = await hashPassword(password);
      const now = new Date().toISOString();
      const tenantId = "tenant-" + uuidv4().slice(0, 8);
      const userId = "user-" + uuidv4().slice(0, 8);
      const tenant = {
        id: tenantId,
        slug: slugTrimmed,
        name: restaurantName.trim(),
        logo: typeof logo === "string" ? logo.trim() : "",
        tagline:
          typeof tagline === "string" && tagline.trim()
            ? tagline.trim()
            : "Fresh food, delivered fast",
        primaryColor:
          typeof primaryColor === "string" && HEX_COLOR_REGEX.test(primaryColor.trim())
            ? primaryColor.trim().toLowerCase()
            : "#d7b51a",
        secondaryColor: "#333333",
        phone: typeof phone === "string" ? phone.trim() : "",
        email: emailLower,
        address: typeof address === "string" ? address.trim() : "",
        whatsapp: typeof phone === "string" ? phone.trim() : "",
        deliveryFee: 150,
        freeDeliveryThreshold: 1500,
        currency: "Rs.",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      store.tenants.push(tenant);
      store.users.push({
        id: userId,
        tenantId,
        name: name.trim(),
        email: emailLower,
        phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
        address: typeof address === "string" && address.trim() ? address.trim() : null,
        passwordHash,
        role: "admin",
        isActive: true,
        createdAt: now,
      });
      const starterCats = [
        { name: "All", icon: "🍽️", sortOrder: 0 },
        { name: "Signature", icon: "⭐", sortOrder: 1 },
        { name: "Sides", icon: "🍟", sortOrder: 2 },
        { name: "Beverages", icon: "🥤", sortOrder: 3 },
      ];
      for (const c of starterCats) {
        store.categories.push({
          id: store.nextId++,
          tenantId,
          name: c.name,
          icon: c.icon,
          sortOrder: c.sortOrder,
          isActive: true,
        });
      }
      writeLocalDb(store);
      await createSession(userId);
      return NextResponse.json({
        success: true,
        data: { slug: tenant.slug, tenantId: tenant.id, name: tenant.name },
      });
    }

    const existing = await db.tenant.findUnique({ where: { slug: slugTrimmed } });
    if (existing) {
      return NextResponse.json({ success: false, error: "That web address is already taken" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const safeColor =
      typeof primaryColor === "string" && HEX_COLOR_REGEX.test(primaryColor.trim())
        ? primaryColor.trim().toLowerCase()
        : "#d7b51a";
    const safeTagline =
      typeof tagline === "string" && tagline.trim()
        ? tagline.trim()
        : "Fresh food, delivered fast";
    const safeLogo = typeof logo === "string" ? logo.trim() : "";

    const { tenant, user } = await db.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          slug: slugTrimmed,
          name: restaurantName.trim(),
          logo: safeLogo,
          primaryColor: safeColor,
          phone: typeof phone === "string" ? phone.trim() : "",
          email: emailLower,
          address: typeof address === "string" ? address.trim() : "",
          tagline: safeTagline,
        },
      });

      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: emailLower,
          phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
          address: typeof address === "string" && address.trim() ? address.trim() : null,
          passwordHash,
          role: "admin",
          tenantId: tenant.id,
        },
      });

      await tx.category.createMany({
        data: [
          { name: "All", icon: "🍽️", sortOrder: 0, tenantId: tenant.id },
          { name: "Signature", icon: "⭐", sortOrder: 1, tenantId: tenant.id },
          { name: "Sides", icon: "🍟", sortOrder: 2, tenantId: tenant.id },
          { name: "Beverages", icon: "🥤", sortOrder: 3, tenantId: tenant.id },
        ],
      });

      return { tenant, user };
    });

    await createSession(user.id);

    return NextResponse.json({
      success: true,
      data: {
        slug: tenant.slug,
        tenantId: tenant.id,
        name: tenant.name,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("DATABASE_URL") || msg.includes("Can't reach database")) {
      return NextResponse.json(
        { success: false, error: "Database is not configured. Add DATABASE_URL in .env to create and persist new restaurants." },
        { status: 503 }
      );
    }
    return NextResponse.json({ success: false, error: "Signup failed" }, { status: 500 });
  }
}