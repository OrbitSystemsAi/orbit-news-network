import { apiError } from "@/lib/api/error";
import { apiSuccess } from "@/lib/api/response";
import { database } from "@/lib/database/client";
import { relevantContentSchema } from "@/lib/validation/content";
import { authenticateProject } from "@/server/services/request-auth";
import { canProjectAccessContent } from "@/server/services/content-access";
import { rankContent } from "@/server/services/content-relevance";
import { resolveProjectTaxonomy } from "@/server/services/taxonomy";
import { loadProjectTopicFeedback } from "@/server/services/personalization";

export async function POST(request: Request) {
  const project = await authenticateProject(request, "content:read");
  if (!project) return apiError("UNAUTHORIZED", "A content:read project key is required.", 401);
  const parsed = relevantContentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "The relevant-content request is invalid.", 400, parsed.error.issues.map(issue => ({ path: issue.path.join("."), message: issue.message })));
  const resolved = await resolveProjectTaxonomy(project.id, parsed.data.topics, parsed.data.classifications);
  if (resolved.unauthorized.length) return apiError("CLASSIFICATION_NOT_AUTHORIZED", "A requested topic or classification is not enabled.", 403, resolved.unauthorized.map(slug => ({ slug })));
  const topicSlugs = resolved.topics.map(topic => topic.slug);
  const topicFeedback = await loadProjectTopicFeedback(project.id, parsed.data.externalUserId);
  const candidates = await database.contentSubmission.findMany({ where: { status: "PUBLISHED", publication: { status: "ACTIVE" }, topics: { some: { topic: { slug: { in: topicSlugs } } } }, ...(parsed.data.contentTypes ? { contentType: { in: parsed.data.contentTypes.map(value => value.toUpperCase() as never) } } : {}) }, include: { project: { include: { organization: true } }, publication: true, contributor: true, topics: { include: { topic: { include: { taxonomyNode: { include: { parent: { include: { parent: true } } } } } } } }, citations: true }, take: 250 });
  const rules = await database.distributionRule.findMany({ where: { status: "ACTIVE" }, include: { targets: true } });
  const eligible = candidates.filter(item => {
    const itemRules = rules.filter(rule => rule.projectId === item.projectId && (!rule.publicationId || rule.publicationId === item.publicationId));
    return canProjectAccessContent({ ...item, distributionRuleTargets: itemRules.flatMap(rule => rule.targets.filter(target => target.status === "ACTIVE").map(target => target.destinationProjectId)) }, { id: project.id, organizationId: project.organizationId ?? "", status: project.status, publicContentAccess: project.publicContentAccess ?? false });
  });
  const maximum = Math.min(parsed.data.maximumItems, project.maximumItemsPerRequest);
  const ranked = rankContent(eligible.map(item => ({ id: item.id, publishedAt: item.publishedAt ?? item.createdAt, title: item.title, publisher: `${item.project.slug}:${item.publication.slug}`, contentType: item.contentType, taxonomy: item.topics[0]?.topic.taxonomyNode?.parent?.parent?.slug ?? item.topics[0]?.topic.slug ?? "unclassified", topics: item.topics.map(topic => ({ slug: topic.topic.slug, weight: topic.weight })) })), resolved.topics, { excludedTopics: parsed.data.excludedTopics, excludedIds: parsed.data.excludeContentIds, maximumItems: maximum, topicFeedback });
  const map = new Map(eligible.map(item => [item.id, item]));
  const items = ranked.map(result => {
    const item = map.get(result.item.id)!;
    return { id: item.id, contentType: item.contentType.toLowerCase(), title: item.title, summary: item.summary, body: item.body, originatingProject: { id: item.project.id, name: item.project.name, slug: item.project.slug }, publication: { id: item.publication.id, name: item.publication.name, slug: item.publication.slug }, contributor: item.contributor ? { displayName: item.contributor.displayName, byline: item.contributor.byline, profileUrl: item.contributor.profileUrl, avatarUrl: item.contributor.avatarUrl } : null, canonicalUrl: item.canonicalUrl, externalMediaUrl: item.externalMediaUrl, topics: item.topics.map(topic => ({ slug: topic.topic.slug, name: topic.topic.name, weight: topic.weight, confidence: topic.confidence, assignmentSource: topic.assignmentSource, subcategory: topic.topic.taxonomyNode?.parent ? { slug: topic.topic.taxonomyNode.parent.slug, name: topic.topic.taxonomyNode.parent.name } : null, category: topic.topic.taxonomyNode?.parent?.parent ? { slug: topic.topic.taxonomyNode.parent.parent.slug, name: topic.topic.taxonomyNode.parent.parent.name } : null })), distributionLevel: item.distributionLevel.toLowerCase(), publishedAt: item.publishedAt?.toISOString(), citations: item.citations, relevanceScore: result.relevanceScore, relevanceExplanation: result.relevanceExplanation };
  });
  await Promise.all(items.map(item => database.distributionDelivery.upsert({ where: { contentSubmissionId_destinationProjectId: { contentSubmissionId: item.id, destinationProjectId: project.id } }, update: { status: "DELIVERED", deliveredAt: new Date() }, create: { contentSubmissionId: item.id, destinationProjectId: project.id, status: "DELIVERED", deliveredAt: new Date() } })));
  return apiSuccess({ project: { id: project.id, slug: project.slug, name: project.name }, generatedAt: new Date().toISOString(), resolvedTopics: resolved.topics, items });
}
