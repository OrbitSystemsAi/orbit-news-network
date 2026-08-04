import { z } from "zod";
import { apiError } from "@/lib/api/error";
import { apiSuccess } from "@/lib/api/response";
import { database } from "@/lib/database/client";
import { isAdminRequest } from "@/server/services/request-auth";
import { assertTransition, moderationReasonCodes, reviewPriority } from "@/server/services/content-workflow";

const statusSchema = z.enum(["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "PUBLISHED", "PAUSED", "ARCHIVED"]);
const decisionSchema = z.object({
  id: z.string().min(1),
  status: statusSchema.optional(),
  action: z.enum(["transition", "escalate"]).default("transition"),
  reasonCode: z.enum(moderationReasonCodes).optional(),
  notes: z.string().trim().max(2000).optional(),
}).strict().superRefine((value, context) => {
  if (["APPROVED", "REJECTED"].includes(value.status ?? "") && !value.reasonCode) context.addIssue({ code: "custom", path: ["reasonCode"], message: "A decision reason is required." });
  if (value.action === "escalate" && !value.reasonCode) context.addIssue({ code: "custom", path: ["reasonCode"], message: "An escalation reason is required." });
  if ((value.status === "REJECTED" || value.action === "escalate") && !value.notes) context.addIssue({ code: "custom", path: ["notes"], message: "Notes are required for rejection or escalation." });
});

const include = { project: true, publication: true, contributor: true, topics: { include: { topic: true } }, citations: true, statusHistory: true, moderationDecisions: true, deliveries: true } as const;

export async function GET(request: Request) {
  if (!await isAdminRequest(request)) return apiError("UNAUTHORIZED", "Administrative access is required.", 401);
  const url = new URL(request.url);
  const rawStatuses = url.searchParams.get("status")?.split(",").filter(Boolean) ?? [];
  const statuses = z.array(statusSchema).safeParse(rawStatuses);
  if (!statuses.success) return apiError("VALIDATION_ERROR", "One or more content statuses are invalid.", 400);
  const q = url.searchParams.get("q")?.trim();
  const records = await database.contentSubmission.findMany({
    where: {
      ...(statuses.data.length ? { status: { in: statuses.data } } : {}),
      ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { externalContentId: { contains: q, mode: "insensitive" as const } }] } : {}),
    },
    include,
    orderBy: { submittedAt: "asc" },
    take: 200,
  });
  return apiSuccess(records.map(record => ({ ...record, reviewPriority: reviewPriority(record.submittedAt) })));
}

export async function PATCH(request: Request) {
  if (!await isAdminRequest(request)) return apiError("UNAUTHORIZED", "Administrative access is required.", 401);
  const parsed = decisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "The moderation decision is invalid.", 400, parsed.error.issues.map(issue => ({ path: issue.path.join("."), message: issue.message })));
  const body = parsed.data;
  const item = await database.contentSubmission.findUnique({ where: { id: body.id }, include: { moderationDecisions: { orderBy: { decidedAt: "desc" }, take: 1 } } });
  if (!item) return apiError("CONTENT_NOT_FOUND", "Content was not found.", 404);

  if (body.action === "escalate") {
    if (item.status !== "UNDER_REVIEW") return apiError("INVALID_STATUS_TRANSITION", "Only content under review can be escalated.", 409);
    const decision = await database.moderationDecision.create({ data: { contentSubmissionId: item.id, decision: "REVIEW_REQUIRED", reasonCode: body.reasonCode!, notes: body.notes, decisionSource: "ADMINISTRATOR" } });
    return apiSuccess({ item, decision });
  }

  if (!body.status) return apiError("VALIDATION_ERROR", "A destination status is required.", 400);
  try { assertTransition(item.status, body.status); } catch { return apiError("INVALID_STATUS_TRANSITION", `Cannot transition from ${item.status} to ${body.status}.`, 409); }
  if (body.status === "PUBLISHED" && item.moderationDecisions[0]?.decision !== "APPROVED") return apiError("APPROVAL_REQUIRED", "An approval decision is required before publication.", 409);

  const updated = await database.$transaction(async tx => {
    const next = await tx.contentSubmission.update({ where: { id: item.id }, data: { status: body.status, publishedAt: body.status === "PUBLISHED" ? new Date() : item.publishedAt } });
    await tx.contentStatusHistory.create({ data: { contentSubmissionId: item.id, previousStatus: item.status, newStatus: body.status!, reason: body.reasonCode ?? `status_${body.status!.toLowerCase()}`, changedByType: "ADMINISTRATOR", changedByIdentifier: "onn-operator" } });
    if (["APPROVED", "REJECTED"].includes(body.status!)) await tx.moderationDecision.create({ data: { contentSubmissionId: item.id, decision: body.status === "APPROVED" ? "APPROVED" : "REJECTED", reasonCode: body.reasonCode!, notes: body.notes, decisionSource: "ADMINISTRATOR" } });
    return next;
  });
  return apiSuccess(updated);
}
