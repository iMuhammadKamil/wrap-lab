import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ success: true, data: { message: "Logged out" } });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ success: false, error: "Failed to logout" }, { status: 500 });
  }
}
