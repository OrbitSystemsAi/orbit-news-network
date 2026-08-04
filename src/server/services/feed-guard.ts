import { database } from "@/lib/database/client";

const bursts = new Map<string, number[]>();
const BURST_WINDOW_MS = 60_000;
const BURST_LIMIT = 60;
const DAILY_LIMIT = 10_000;
export const MAX_FEED_PAYLOAD_BYTES = 32_768;

export async function checkFeedQuota(projectId: string, endpoint = "/api/v1/feed/relevant", now = new Date()) {
  const quotaKey = `${projectId}:${endpoint}`;
  const cutoff = now.getTime() - BURST_WINDOW_MS;
  const recent = (bursts.get(quotaKey) ?? []).filter(timestamp => timestamp > cutoff);
  if (recent.length >= BURST_LIMIT) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((recent[0] + BURST_WINDOW_MS - now.getTime()) / 1000)), reason: "burst" as const };

  const day = new Date(now);
  day.setUTCHours(0, 0, 0, 0);
  const daily = await database.apiRequestLog.count({ where: { projectId, endpoint, requestedAt: { gte: day } } });
  if (daily >= DAILY_LIMIT) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((day.getTime() + 86_400_000 - now.getTime()) / 1000)), reason: "daily" as const };

  recent.push(now.getTime());
  bursts.set(quotaKey, recent);
  return { allowed: true, remaining: Math.max(0, DAILY_LIMIT - daily - 1) };
}

export function payloadBytes(request: Request) {
  const declared = Number(request.headers.get("content-length"));
  return Number.isFinite(declared) ? declared : null;
}
