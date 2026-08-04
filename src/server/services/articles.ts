import { createHash } from "node:crypto";

const TRACKERS = new Set(["utm_source","utm_medium","utm_campaign","utm_term","utm_content","gclid","dclid","fbclid","msclkid","mc_cid","mc_eid"]);

export function canonicalizeUrl(value: string) {
  const url = new URL(value);
  if (url.protocol === "http:") url.protocol = "https:";
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKERS.has(key.toLowerCase())) url.searchParams.delete(key);
  }
  url.hostname = url.hostname.toLowerCase();
  url.pathname = url.pathname.replace(/\/{2,}/g, "/").replace(/\/$/, "") || "/";
  [...url.searchParams.entries()].sort(([a],[b]) => a.localeCompare(b)).forEach(([key]) => {
    const values = url.searchParams.getAll(key);
    url.searchParams.delete(key);
    values.sort().forEach(v => url.searchParams.append(key, v));
  });
  return url.toString();
}

export function normalizeTitle(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function contentFingerprint(input: { canonicalUrl: string; title: string; source: string; publishedAt: Date }) {
  const day = input.publishedAt.toISOString().slice(0, 10);
  return createHash("sha256").update([
    canonicalizeUrl(input.canonicalUrl), normalizeTitle(input.title), input.source.toLowerCase().trim(), day,
  ].join("|")).digest("hex");
}

export function isVisibleArticle(publishedAt: Date | null, collectedAt: Date, now = new Date(), visibleHours = 24) {
  const effective = publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : collectedAt;
  return effective.getTime() >= now.getTime() - visibleHours * 3_600_000;
}

export function isDuplicate(candidate: {canonicalUrl:string; externalId?:string|null; fingerprint:string}, existing: Array<{canonicalUrl:string; externalId?:string|null; fingerprint:string}>) {
  const url = canonicalizeUrl(candidate.canonicalUrl);
  return existing.some(item => canonicalizeUrl(item.canonicalUrl) === url ||
    Boolean(candidate.externalId && item.externalId === candidate.externalId) ||
    item.fingerprint === candidate.fingerprint);
}
