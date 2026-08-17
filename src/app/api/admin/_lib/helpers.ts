import { NextResponse } from "next/server";
import { requireAuth, AuthError, type AuthUser } from "@/lib/auth";

export const ADMIN_STATUSES = ["pending", "confirmed", "preparing", "delivered", "cancelled"] as const;
export const OFFER_TYPES = ["percentage", "flat", "free_delivery"] as const;

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role !== "admin") throw new AuthError("Admin access required", 403);
  return user;
}

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(message: string, status: number): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function handleError(error: unknown, fallback: string): NextResponse {
  if (error instanceof AuthError) {
    return fail(error.message, error.status);
  }
  console.error(fallback, error);
  return fail(fallback, 500);
}

export function isPrismaDuplicate(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "P2002"
  );
}

export function stripTenantId<T extends { tenantId?: string }>(row: T): Omit<T, "tenantId"> {
  const { tenantId, ...rest } = row;
  return rest;
}

export function parseIntParam(value: string | undefined): number | null {
  if (value === undefined) return null;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export function isValidHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR_RE.test(value);
}