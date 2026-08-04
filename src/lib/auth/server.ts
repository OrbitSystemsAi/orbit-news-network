import { createNeonAuth, type NeonAuth } from "@neondatabase/auth/next/server";
import { serverEnvironment } from "@/lib/environment/server";

let instance: NeonAuth | null | undefined;

export function getNeonAuth() {
  if (instance !== undefined) return instance;

  const { NEON_AUTH_BASE_URL: baseUrl, NEON_AUTH_COOKIE_SECRET: secret } = serverEnvironment;
  if (!baseUrl || !secret) {
    instance = null;
    return instance;
  }

  instance = createNeonAuth({
    baseUrl,
    cookies: { secret, sameSite: "strict" },
    logLevel: "warn",
  });
  return instance;
}

export function isNeonAuthConfigured() {
  return Boolean(serverEnvironment.NEON_AUTH_BASE_URL && serverEnvironment.NEON_AUTH_COOKIE_SECRET);
}
