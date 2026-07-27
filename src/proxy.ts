import { NextRequest, NextResponse } from "next/server";
import { accessCookieName, verifyAccessSession } from "@/lib/security/access-session";

export function proxy(request: NextRequest) {
  const session = request.cookies.get(accessCookieName)?.value;
  if (verifyAccessSession(session, process.env.ADMIN_ACCESS_KEY)) return NextResponse.next();

  const accessUrl = new URL("/access", request.url);
  accessUrl.searchParams.set("returnTo", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(accessUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*"],
};
