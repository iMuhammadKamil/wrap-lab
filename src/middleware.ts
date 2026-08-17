import { NextRequest, NextResponse } from "next/server";

// Tenant convention: storefronts live at /<slug>/api/*, e.g. /wraplab/api/products.
// Rewrite to the platform handler /api/* and forward the tenant slug via header,
// so the handler can resolve the tenant and scope every query.
export function middleware(req: NextRequest) {
  const segments = req.nextUrl.pathname.split("/").filter(Boolean);
  if (segments.length < 2 || segments[1] !== "api") {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/api/" + segments.slice(2).join("/");

  const res = NextResponse.rewrite(url);
  res.headers.set("x-tenant-slug", segments[0]);
  return res;
}

export const config = {
  matcher: ["/:slug/api/:path*"],
};