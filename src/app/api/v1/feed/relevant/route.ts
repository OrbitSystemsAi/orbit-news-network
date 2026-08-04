import { apiError } from "@/lib/api/error";
import { apiSuccess } from "@/lib/api/response";
import { database } from "@/lib/database/client";
import { unifiedFeedSchema } from "@/lib/validation/content";
import { checkFeedQuota, MAX_FEED_PAYLOAD_BYTES, payloadBytes } from "@/server/services/feed-guard";
import { authenticateProject } from "@/server/services/request-auth";
import { composeUnifiedFeed } from "@/server/services/unified-feed";

export async function POST(request: Request) {
  const started = Date.now();
  const requestId = crypto.randomUUID();
  const project = await authenticateProject(request, "feed:read");
  if (!project) return apiError("UNAUTHORIZED", "A feed:read project key is required.", 401, [], requestId);
  if ((payloadBytes(request) ?? 0) > MAX_FEED_PAYLOAD_BYTES) return apiError("PAYLOAD_TOO_LARGE", `Feed requests must not exceed ${MAX_FEED_PAYLOAD_BYTES} bytes.`, 413, [], requestId);

  const body = await request.json().catch(() => null);
  if (body && Buffer.byteLength(JSON.stringify(body), "utf8") > MAX_FEED_PAYLOAD_BYTES) return apiError("PAYLOAD_TOO_LARGE", `Feed requests must not exceed ${MAX_FEED_PAYLOAD_BYTES} bytes.`, 413, [], requestId);
  const parsed = unifiedFeedSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "The unified-feed request is invalid.", 400, parsed.error.issues.map(issue => ({ path: issue.path.join("."), message: issue.message })), requestId);

  const quota = await checkFeedQuota(project.id);
  if (!quota.allowed) return apiError("RATE_LIMITED", "The project feed request limit has been reached.", 429, [{ retryAfterSeconds: quota.retryAfterSeconds, limit: quota.reason }], requestId);

  try {
    const result = await composeUnifiedFeed(project, parsed.data);
    if (!result.ok) return apiError("CLASSIFICATION_NOT_AUTHORIZED", "One or more topics or classifications are not enabled for this project.", 403, result.unauthorized.map(slug => ({ slug })), requestId);
    const bothUnavailable = result.sections.firstParty.status === "unavailable" && result.sections.externalNews.status === "unavailable";
    const status = bothUnavailable ? 503 : result.partial ? 206 : 200;
    await database.apiRequestLog.create({ data: { projectId: project.id, endpoint: "/api/v1/feed/relevant", httpMethod: "POST", responseStatus: status, durationMs: Date.now() - started, requestId } });
    if (bothUnavailable) return apiError("FEED_UNAVAILABLE", "No requested feed origin is currently available.", 503, Object.values(result.sections).flatMap(section => section.error ? [section.error] : []), requestId);
    return apiSuccess({ project: { id: project.id, slug: project.slug, name: project.name }, ...result, quota: { remainingToday: quota.remaining } }, status, { requestId });
  } catch {
    await database.apiRequestLog.create({ data: { projectId: project.id, endpoint: "/api/v1/feed/relevant", httpMethod: "POST", responseStatus: 500, durationMs: Date.now() - started, requestId } });
    return apiError("INTERNAL_ERROR", "The feed could not be generated.", 500, [], requestId);
  }
}
