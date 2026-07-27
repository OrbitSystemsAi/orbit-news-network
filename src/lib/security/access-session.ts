import { createHmac, timingSafeEqual } from "node:crypto";

export const accessCookieName = "onn_private_mvp_session";

function signature(expiresAt: string, secret: string) {
  return createHmac("sha256", secret).update(`onn-private-mvp:${expiresAt}`).digest("base64url");
}

export function createAccessSession(secret: string, lifetimeHours: number, now = Date.now()) {
  const expiresAt = String(now + lifetimeHours * 60 * 60 * 1000);
  return `${expiresAt}.${signature(expiresAt, secret)}`;
}

export function verifyAccessSession(value: string | undefined, secret: string | undefined, now = Date.now()) {
  if (!value || !secret) return false;
  const [expiresAt, supplied, extra] = value.split(".");
  if (!expiresAt || !supplied || extra || !/^\d+$/.test(expiresAt) || Number(expiresAt) <= now) return false;
  const expected = signature(expiresAt, secret);
  const left = Buffer.from(expected);
  const right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function cookieValue(cookieHeader: string | null, name: string) {
  return cookieHeader?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}
