import { z } from "zod";
import { apiError } from "@/lib/api/error";
import { apiSuccess } from "@/lib/api/response";
import { database } from "@/lib/database/client";
import { isAdminRequest } from "@/server/services/request-auth";

const assignmentSchema = z.object({
  targetType: z.enum(["first_party", "external_news"]),
  targetId: z.string().min(1),
  topicSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  action: z.enum(["assign", "remove"]).default("assign"),
  confidence: z.number().min(0).max(1).default(1),
}).strict();

export async function POST(request: Request) {
  if (!await isAdminRequest(request)) return apiError("UNAUTHORIZED", "Administrative access is required.", 401);
  const parsed = assignmentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "The classification assignment is invalid.", 400, parsed.error.issues.map(issue => ({ path: issue.path.join("."), message: issue.message })));
  const body = parsed.data;
  const topic = await database.topic.findFirst({ where: { slug: body.topicSlug, status: "ACTIVE", taxonomyNode: { status: "ACTIVE" } } });
  if (!topic) return apiError("CLASSIFICATION_NOT_FOUND", "The active topic classification was not found.", 404);

  if (body.targetType === "first_party") {
    const target = await database.contentSubmission.findUnique({ where: { id: body.targetId } });
    if (!target) return apiError("CONTENT_NOT_FOUND", "The content submission was not found.", 404);
    await database.contentSubmissionTopic.deleteMany({ where: { contentSubmissionId: body.targetId, topicId: topic.id } });
    if (body.action === "assign") await database.contentSubmissionTopic.create({ data: { contentSubmissionId: body.targetId, topicId: topic.id, weight: body.confidence * 10, confidence: body.confidence, assignmentSource: "MANUAL" } });
  } else {
    const target = await database.externalArticle.findUnique({ where: { id: body.targetId } });
    if (!target) return apiError("ARTICLE_NOT_FOUND", "The external article was not found.", 404);
    await database.externalArticleTopic.deleteMany({ where: { externalArticleId: body.targetId, topicId: topic.id } });
    if (body.action === "assign") await database.externalArticleTopic.create({ data: { externalArticleId: body.targetId, topicId: topic.id, score: body.confidence, assignmentSource: "MANUAL" } });
  }
  return apiSuccess({ targetType: body.targetType, targetId: body.targetId, topicSlug: body.topicSlug, action: body.action, confidence: body.action === "assign" ? body.confidence : null });
}
