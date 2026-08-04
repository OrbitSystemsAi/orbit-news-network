import { apiError } from "@/lib/api/error";
import { apiSuccess } from "@/lib/api/response";
import { database } from "@/lib/database/client";
import { feedFeedbackSchema } from "@/lib/validation/content";
import { checkFeedQuota, MAX_FEED_PAYLOAD_BYTES, payloadBytes } from "@/server/services/feed-guard";
import { FeedItemNotFoundError, recordFeedInteraction } from "@/server/services/feed-interactions";
import { authenticateProject } from "@/server/services/request-auth";

export async function POST(request: Request) {
  const started = Date.now(), requestId = crypto.randomUUID();
  const project = await authenticateProject(request, "feed:feedback");
  if (!project) return apiError("UNAUTHORIZED", "A feed:feedback project key is required.", 401, [], requestId);
  if ((payloadBytes(request) ?? 0) > MAX_FEED_PAYLOAD_BYTES) return apiError("PAYLOAD_TOO_LARGE", `Feed requests must not exceed ${MAX_FEED_PAYLOAD_BYTES} bytes.`, 413, [], requestId);
  const parsed = feedFeedbackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Invalid feed feedback.", 400, parsed.error.issues.map(issue => ({ path: issue.path.join("."), message: issue.message })), requestId);
  const quota = await checkFeedQuota(project.id, "/api/v1/feed/feedback");
  if (!quota.allowed) return apiError("RATE_LIMITED", "The project feedback limit has been reached.", 429, [{ retryAfterSeconds: quota.retryAfterSeconds, limit: quota.reason }], requestId);
  let interaction;
  try {
    interaction = await recordFeedInteraction({ projectId: project.id, ...parsed.data });
  } catch (error) {
    if (error instanceof FeedItemNotFoundError) return apiError("FEED_ITEM_NOT_FOUND", "An eligible feed item was not found.", 404, [], requestId);
    return apiError("INTERNAL_ERROR", "The feed interaction could not be recorded.", 500, [], requestId);
  }
  await database.apiRequestLog.create({ data: { projectId: project.id, endpoint: "/api/v1/feed/feedback", httpMethod: "POST", responseStatus: 201, durationMs: Date.now() - started, requestId } });
  return apiSuccess({ id: interaction.id, recorded: true }, 201, { requestId });
}
