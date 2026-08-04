import { describe, expect, it } from "vitest";
import { accessCookieName, cookieValue, createAccessSession, verifyAccessSession } from "../src/lib/security/access-session";
import { parseAllowedEmails } from "../src/lib/auth/allowed-emails";

describe("private MVP access session", () => {
  const secret = "a-secure-administrative-secret-with-enough-entropy";
  const now = Date.UTC(2026, 6, 27);

  it("accepts a signed, unexpired session", () => {
    const value = createAccessSession(secret, 8, now);
    expect(verifyAccessSession(value, secret, now + 1_000)).toBe(true);
  });

  it("rejects tampering, expiration, and a different secret", () => {
    const value = createAccessSession(secret, 1, now);
    expect(verifyAccessSession(`${value}x`, secret, now)).toBe(false);
    expect(verifyAccessSession(value, "another-secure-administrative-secret-value", now)).toBe(false);
    expect(verifyAccessSession(value, secret, now + 3_600_001)).toBe(false);
  });

  it("reads only the requested cookie", () => {
    const value = createAccessSession(secret, 1, now);
    expect(cookieValue(`theme=dark; ${accessCookieName}=${value}; preference=compact`, accessCookieName)).toBe(value);
  });
});

describe("ONN administrator allowlist", () => {
  it("normalizes addresses and ignores empty entries", () => {
    expect([...parseAllowedEmails(" Admin@Orbit.test, operator@orbit.test, ")]).toEqual([
      "admin@orbit.test",
      "operator@orbit.test",
    ]);
  });
});
