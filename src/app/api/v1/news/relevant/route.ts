import { apiError } from "@/lib/api/error";
import { apiSuccess } from "@/lib/api/response";
import { database } from "@/lib/database/client";
import { relevantNewsRequestSchema } from "@/lib/validation/news";
import { authenticateProject } from "@/server/services/request-auth";
import { refreshRelevantSources } from "@/server/services/refresh";
import { rankRelevantArticles } from "@/server/services/relevance";
import { serverEnvironment } from "@/lib/environment/server";
import { resolveProjectTaxonomy } from "@/server/services/taxonomy";
import { loadProjectTopicFeedback } from "@/server/services/personalization";
import { sourceQualityScore } from "@/server/services/curation";

export async function POST(request: Request) {
  const started = Date.now(), requestId = crypto.randomUUID();
  const project = await authenticateProject(request);
  if (!project) return apiError("UNAUTHORIZED", "A valid project API key is required.", 401, [], requestId);
  const parsed = relevantNewsRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "The news request is invalid.", 400, parsed.error.issues.map(issue => ({ path: issue.path.join("."), message: issue.message })), requestId);
  const resolved = await resolveProjectTaxonomy(project.id, parsed.data.topics, parsed.data.classifications);
  if (resolved.unauthorized.length) return apiError("CLASSIFICATION_NOT_AUTHORIZED", "One or more topics or classifications are not enabled for this project.", 403, resolved.unauthorized.map(slug => ({ slug })), requestId);
  const topicSlugs = resolved.topics.map(topic => topic.slug);
  const topicFeedback = await loadProjectTopicFeedback(project.id, parsed.data.externalUserId);
  const maximum = Math.min(parsed.data.maximumItems ?? project.maximumItemsPerRequest, project.maximumItemsPerRequest);
  const refresh = await refreshRelevantSources(topicSlugs, project.minimumRefreshIntervalMinutes, project.id);
  const cutoff = new Date(Date.now() - serverEnvironment.NEWS_VISIBLE_HOURS * 3_600_000);
  const articles = await database.externalArticle.findMany({ where: { status: "ACTIVE", publishedAt: { gte: cutoff }, topics: { some: { topic: { slug: { in: topicSlugs } } } } }, include: { feedSource: true, topics: { include: { topic: { include: { taxonomyNode: { include: { parent: { include: { parent: true } } } } } } } } }, take: 200 });
  const ranked = rankRelevantArticles(articles.map(article => ({ id: article.id, publishedAt: article.publishedAt, title: article.title, description: article.description ?? "", publisher: article.feedSource.slug, contentType: "external_news", taxonomy: article.topics[0]?.topic.taxonomyNode?.parent?.parent?.slug ?? article.topics[0]?.topic.slug ?? "unclassified", sourceQuality: sourceQualityScore(article.feedSource), topics: article.topics.map(topic => ({ slug: topic.topic.slug, score: topic.score, assignmentSource: topic.assignmentSource })) })), resolved.topics, { excludedTopics: parsed.data.excludedTopics, excludeArticleIds: parsed.data.excludeArticleIds, maximumItems: maximum, topicFeedback });
  const byId = new Map(articles.map(article => [article.id, article]));
  const items = ranked.map(({ article, relevanceScore, relevanceExplanation }) => {
    const item = byId.get(article.id)!;
    return { id: item.id, title: item.title, description: item.description, source: { name: item.feedSource.name, websiteUrl: item.feedSource.websiteUrl, qualityScore: sourceQualityScore(item.feedSource) }, originalUrl: item.canonicalUrl, imageUrl: item.imageUrl, publishedAt: item.publishedAt.toISOString(), matchedTopics: item.topics.filter(topic => topicSlugs.includes(topic.topic.slug)).map(topic => ({ slug: topic.topic.slug, name: topic.topic.name, score: topic.score, assignmentSource: topic.assignmentSource, subcategory: topic.topic.taxonomyNode?.parent ? { slug: topic.topic.taxonomyNode.parent.slug, name: topic.topic.taxonomyNode.parent.name } : null, category: topic.topic.taxonomyNode?.parent?.parent ? { slug: topic.topic.taxonomyNode.parent.parent.slug, name: topic.topic.taxonomyNode.parent.parent.name } : null })), relevanceScore, relevanceExplanation };
  });
  await database.apiRequestLog.create({ data: { projectId: project.id, endpoint: "/api/v1/news/relevant", httpMethod: "POST", responseStatus: 200, durationMs: Date.now() - started, requestId } });
  return apiSuccess({ project: { id: project.id, slug: project.slug, name: project.name }, generatedAt: new Date().toISOString(), resolvedTopics: resolved.topics, refresh, items }, 200, { requestId });
}
