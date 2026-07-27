import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export type KeyEnvironment = "development" | "production";
export const API_KEY_SCOPES = ["news:read","news:feedback","content:submit","content:read","content:feedback","publications:read","feed:read","analytics:read"] as const;
export type ApiKeyScope = typeof API_KEY_SCOPES[number];

function pepper(secret: string) {
  if (secret.length < 32) throw new Error("API_KEY_HASH_SECRET must contain at least 32 characters.");
  return secret;
}

export function generateApiKey(environment: KeyEnvironment = "development") {
  const marker = environment === "production" ? "live" : "dev";
  const raw = randomBytes(32).toString("base64url");
  const key = `onn_${marker}_${raw}`;
  return { key, prefix: key.slice(0, 16), environment };
}

export function hashApiKey(key: string, secret: string) {
  const salt = createHash("sha256").update(key.slice(0, 16)).digest();
  return scryptSync(`${key}:${pepper(secret)}`, salt, 32, { N: 16384, r: 8, p: 1 }).toString("hex");
}

export function verifyApiKey(key: string, storedHash: string, secret: string) {
  const candidate = hashApiKey(key, secret);
  const a = Buffer.from(candidate);
  const b = Buffer.from(storedHash);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function apiKeyPrefix(key: string) {
  return key.slice(0, 16);
}
