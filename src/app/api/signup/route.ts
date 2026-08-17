import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { restaurantName, slug, name, email, password, phone, address } = body;

    if (!restaurantName || typeof restaurantName !== "string" || restaurantName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Restaurant name must be at least 2 characters" },
        { status: 400 }
      );
    }

    const slugTrimmed = typeof slug === "string" ? slug.trim().toLowerCase() : "";
    if (slugTrimmed.length < 3 || slugTrimmed.length > 30 || !SLUG_REGEX.test(slugTrimmed)) {
      return NextResponse.json(
        { success: false, error: "Web address must be 3-30 characters and use only lowercase letters, numbers, and hyphens" },
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

    const existing = await db.tenant.findUnique({ where: { slug: slugTrimmed } });
    if (existing) {
      return NextResponse.json({ success: false, error: "That web address is already taken" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const { tenant, user } = await db.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          slug: slugTrimmed,
          name: restaurantName.trim(),
          phone: typeof phone === "string" ? phone.trim() : "",
          address: typeof address === "string" ? address.trim() : "",
          tagline: "Fresh food, delivered fast",
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

      await tx.category.create({
        data: {
          name: "All",
          icon: "🍽️",
          sortOrder: 0,
          tenantId: tenant.id,
        },
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
    return NextResponse.json({ success: false, error: "Signup failed" }, { status: 500 });
  }
}