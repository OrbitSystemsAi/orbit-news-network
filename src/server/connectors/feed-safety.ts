import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const BLOCKED_HOSTNAMES = new Set(["localhost", "localhost.localdomain"]);

function isPrivateIpv4(address: string) {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b, c] = octets;
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113);
}

export function isPublicNetworkAddress(address: string) {
  const version = isIP(address);
  if (version === 4) return !isPrivateIpv4(address);
  if (version === 6) {
    const normalized = address.toLowerCase();
    if (normalized.startsWith("::ffff:")) return isPublicNetworkAddress(normalized.slice(7));
    return normalized !== "::" && normalized !== "::1" &&
      !normalized.startsWith("fc") && !normalized.startsWith("fd") &&
      !normalized.startsWith("fe8") && !normalized.startsWith("fe9") &&
      !normalized.startsWith("fea") && !normalized.startsWith("feb") &&
      !normalized.startsWith("ff");
  }
  return false;
}

export async function assertSafeFeedUrl(value: string) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Feed URL must use HTTP or HTTPS.");
  if (url.username || url.password) throw new Error("Feed URL must not contain credentials.");
  if (url.port && !["80", "443"].includes(url.port)) throw new Error("Feed URL uses an unsupported port.");

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new Error("Feed URL must use a public host.");
  }

  const literalVersion = isIP(hostname);
  const addresses = literalVersion ? [{ address: hostname }] : await lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(({ address }) => !isPublicNetworkAddress(address))) {
    throw new Error("Feed URL resolves to a non-public address.");
  }

  return url;
}
