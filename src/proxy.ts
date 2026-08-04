import { NextRequest, NextResponse } from "next/server";
import { getNeonAuth } from "@/lib/auth/server";
import { accessCookieName, verifyAccessSession } from "@/lib/security/access-session";

export async function proxy(request: NextRequest) {
  const auth = getNeonAuth();
  if (auth) return auth.middleware({ loginUrl: "/access/sign-in" })(request);

  const session = request.cookies.get(accessCookieName)?.value;
  if (verifyAccessSession(session, process.env.ADMIN_ACCESS_KEY)) return NextResponse.next();

  const accessUrl = new URL("/access", request.url);
  accessUrl.searchParams.set("returnTo", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(accessUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*"],
};
