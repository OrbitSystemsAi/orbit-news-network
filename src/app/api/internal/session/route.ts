import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { accessCookieName, createAccessSession } from "@/lib/security/access-session";
import { serverEnvironment } from "@/lib/environment/server";

function equal(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const supplied = String(form.get("accessKey") ?? "");
  const requested = String(form.get("returnTo") ?? "/portal");
  const returnTo = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/portal";
  const secret = serverEnvironment.ADMIN_ACCESS_KEY;

  if (!secret || !equal(supplied, secret)) {
    const failed = new URL("/access", request.url);
    failed.searchParams.set("error", "invalid");
    failed.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(failed, 303);
  }

  const response = NextResponse.redirect(new URL(returnTo, request.url), 303);
  response.cookies.set(accessCookieName, createAccessSession(secret, serverEnvironment.ACCESS_SESSION_HOURS), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: serverEnvironment.ACCESS_SESSION_HOURS * 60 * 60,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ data: { signedOut: true } });
  response.cookies.set(accessCookieName, "", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
  return response;
}
