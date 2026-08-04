import { apiError } from "@/lib/api/error";
import { apiSuccess } from "@/lib/api/response";
import { database } from "@/lib/database/client";
import { sourceInputSchema } from "@/lib/validation/news";
import { isAdminRequest } from "@/server/services/request-auth";
import { RssAtomConnector } from "@/server/connectors/rss-atom";
import { z } from "zod";

const sourceUpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["ACTIVE", "PAUSED", "REJECTED", "PENDING_REVIEW"]).optional(),
  minimumRefreshIntervalMinutes: z.number().int().min(5).max(1440).optional(),
  officialFeedConfirmed: z.boolean().optional(),
  termsReviewed: z.boolean().optional(),
  attributionNotes: z.string().trim().max(2000).optional(),
  editorialNotes: z.string().trim().max(4000).optional(),
}).strict();

export async function GET(request: Request) {
  if (!await isAdminRequest(request)) return apiError("UNAUTHORIZED", "Administrative access is required.", 401);
  const [sources, availableTopics, recentArticles, recentRuns] = await Promise.all([
    database.feedSource.findMany({ include: { topics: { include: { topic: true } } }, orderBy: { name: "asc" } }),
    database.topic.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } }),
    database.externalArticle.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, title: true, canonicalUrl: true, publishedAt: true, collectedAt: true, feedSource: { select: { name: true } }, topics: { select: { topic: { select: { name: true } } } } },
      orderBy: { publishedAt: "desc" },
      take: 10,
    }),
    database.processingRun.findMany({
      select: { id: true, status: true, triggerType: true, startedAt: true, completedAt: true, sourcesProcessed: true, articlesDiscovered: true, articlesAdded: true, duplicatesSkipped: true, articlesExpired: true },
      orderBy: { startedAt: "desc" },
      take: 5,
    }),
  ]);
  return apiSuccess({ sources, availableTopics, recentArticles, recentRuns });
}

export async function POST(request: Request) {
  if (!await isAdminRequest(request)) return apiError("UNAUTHORIZED", "Administrative access is required.", 401);
  const body = await request.json().catch(() => null);
  if (body?.action === "test") {
    const parsed = sourceInputSchema.pick({ name: true, feedUrl: true, feedType: true }).safeParse(body);
    if (!parsed.success) return apiError("VALIDATION_ERROR", "Enter a valid source name and public feed URL.", 400);
    try {
      const items = await new RssAtomConnector().collect(parsed.data);
      return apiSuccess({ valid: true, itemCount: items.length, sampleTitles: items.slice(0, 3).map((item) => item.title), format: items[0]?.sourceMetadata.format ?? "unknown" });
    } catch {
      return apiError("SOURCE_TEST_FAILED", "The source could not be safely fetched or parsed as RSS/Atom.", 422);
    }
  }

  const parsed = sourceInputSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Invalid source.", 400, parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })));
  if (parsed.data.topicSlugs.length === 0) return apiError("TOPICS_REQUIRED", "Select at least one topic before adding the source.", 400);

  const topics = await database.topic.findMany({ where: { slug: { in: parsed.data.topicSlugs }, status: "ACTIVE" } });
  if (topics.length !== new Set(parsed.data.topicSlugs).size) return apiError("INVALID_TOPICS", "One or more selected topics are unavailable.", 400);

  const source = await database.feedSource.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      feedUrl: parsed.data.feedUrl,
      websiteUrl: parsed.data.websiteUrl,
      feedType: parsed.data.feedType.toUpperCase() as "RSS" | "ATOM" | "AUTO",
      status: "PENDING_REVIEW",
      minimumRefreshIntervalMinutes: parsed.data.minimumRefreshIntervalMinutes,
      topics: { create: topics.map((topic) => ({ topicId: topic.id, weight: 1 })) },
    },
  });
  return apiSuccess(source, 201);
}

export async function PATCH(request: Request) {
  if (!await isAdminRequest(request)) return apiError("UNAUTHORIZED", "Administrative access is required.", 401);
  const parsed = sourceUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "The source review is invalid.", 400, parsed.error.issues.map(issue => ({ path: issue.path.join("."), message: issue.message })));
  const body = parsed.data;
  const existing = await database.feedSource.findUnique({ where: { id: body.id } });
  if (!existing) return apiError("SOURCE_NOT_FOUND", "The source was not found.", 404);
  if (body.status === "ACTIVE") {
    const official = body.officialFeedConfirmed ?? existing.officialFeedConfirmed;
    const terms = body.termsReviewed ?? existing.termsReviewed;
    const attribution = body.attributionNotes ?? existing.attributionNotes;
    if (!official || !terms || !attribution?.trim()) return apiError("SOURCE_REVIEW_REQUIRED", "Confirm official feed ownership, terms review, and attribution requirements before activation.", 409);
  }
  const reviewed = body.status === "ACTIVE";
  return apiSuccess(await database.feedSource.update({
    where: { id: body.id },
    data: {
      status: body.status,
      minimumRefreshIntervalMinutes: body.minimumRefreshIntervalMinutes,
      officialFeedConfirmed: body.officialFeedConfirmed,
      termsReviewed: body.termsReviewed,
      attributionNotes: body.attributionNotes,
      editorialNotes: body.editorialNotes,
      reviewedAt: reviewed ? new Date() : undefined,
      reviewedByIdentifier: reviewed ? "onn-operator" : undefined,
      policyReviewDueAt: reviewed ? new Date(Date.now() + 180 * 24 * 3_600_000) : undefined,
    },
  }));
}
