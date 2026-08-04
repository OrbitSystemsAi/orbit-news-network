import { createHash } from "node:crypto";
import type { UnifiedFeedRequest } from "@/lib/validation/content";
import { database } from "@/lib/database/client";
import { serverEnvironment } from "@/lib/environment/server";
import { canProjectAccessContent } from "./content-access";
import { rankContent } from "./content-relevance";
import { sourceQualityScore } from "./curation";
import { loadProjectTopicFeedback } from "./personalization";
import { rankRelevantArticles } from "./relevance";
import { refreshRelevantSources } from "./refresh";
import { resolveProjectTaxonomy } from "./taxonomy";
import { permittedSourceImageUrl } from "./source-media";

type FeedProject = { id: string; organizationId?: string; slug: string; name: string; status: string; publicContentAccess?: boolean; maximumItemsPerRequest: number; minimumRefreshIntervalMinutes: number };
type FeedOrigin = "first_party" | "external_news";
type NormalizedItem = {
  id: string;
  origin: FeedOrigin;
  contentType: string;
  title: string;
  summary: string | null;
  url: string | null;
  imageUrl: string | null;
  publisher: { name: string; slug: string };
  publishedAt: string;
  topics: Array<{ slug: string; name: string; confidence: number; category: { slug: string; name: string } | null; subcategory: { slug: string; name: string } | null }>;
  provenance: { kind: FeedOrigin; sourceId: string; sourceName: string; originalUrl: string | null };
  relevanceScore: number;
  relevanceExplanation: unknown;
};

type FeedSection = { status: "complete" | "unavailable"; items: NormalizedItem[]; error?: { code: string; message: string } };
type CacheEntry = { expiresAt: number; value: Awaited<ReturnType<typeof composeUncached>> };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30_000;

export function mergeFeedSections(firstPartySection: FeedSection, newsSection: FeedSection, maximumItems: number) {
  return [...firstPartySection.items, ...newsSection.items]
    .sort((a, b) => b.relevanceScore - a.relevanceScore || b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, maximumItems);
}

async function withTimeout<T>(operation: Promise<T>) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error("ORIGIN_TIMEOUT")), serverEnvironment.FEED_REQUEST_TIMEOUT_MS); }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function cacheKey(projectId: string, request: UnifiedFeedRequest) {
  return createHash("sha256").update(JSON.stringify([projectId, request])).digest("hex");
}

async function firstParty(project: FeedProject, input: UnifiedFeedRequest, resolved: Awaited<ReturnType<typeof resolveProjectTaxonomy>>, topicFeedback: Map<string, number>): Promise<NormalizedItem[]> {
  if (input.origins && !input.origins.includes("first_party")) return [];
  const topicSlugs = resolved.topics.map(topic => topic.slug);
  const candidates = await database.contentSubmission.findMany({
    where: {
      status: "PUBLISHED",
      ...(input.distributionLevels ? { distributionLevel: { in: input.distributionLevels.map(value => value.toUpperCase() as never) } } : {}),
      publication: { status: "ACTIVE", ...(input.publicationSlugs ? { slug: { in: input.publicationSlugs } } : {}) },
      topics: { some: { topic: { slug: { in: topicSlugs } } } },
      ...(input.contentTypes ? { contentType: { in: input.contentTypes.map(value => value.toUpperCase() as never) } } : {}),
      OR: [{ publishedAt: { gte: new Date(Date.now() - input.maximumAgeHours * 3_600_000) } }, { publishedAt: null, createdAt: { gte: new Date(Date.now() - input.maximumAgeHours * 3_600_000) } }],
    },
    include: { project: { include: { organization: true } }, publication: true, topics: { include: { topic: { include: { taxonomyNode: { include: { parent: { include: { parent: true } } } } } } } } },
    take: 250,
  });
  const rules = await database.distributionRule.findMany({ where: { status: "ACTIVE" }, include: { targets: true } });
  const eligible = candidates.filter(item => canProjectAccessContent({ ...item, distributionRuleTargets: rules.filter(rule => rule.projectId === item.projectId && (!rule.publicationId || rule.publicationId === item.publicationId)).flatMap(rule => rule.targets.filter(target => target.status === "ACTIVE").map(target => target.destinationProjectId)) }, { id: project.id, organizationId: project.organizationId ?? "", status: project.status, publicContentAccess: project.publicContentAccess ?? false }));
  const ranked = rankContent(eligible.map(item => ({ id: item.id, publishedAt: item.publishedAt ?? item.createdAt, title: item.title, publisher: `${item.project.slug}:${item.publication.slug}`, contentType: item.contentType, taxonomy: item.topics[0]?.topic.taxonomyNode?.parent?.parent?.slug ?? item.topics[0]?.topic.slug ?? "unclassified", topics: item.topics.map(topic => ({ slug: topic.topic.slug, weight: topic.weight })) })), resolved.topics, { excludedTopics: input.excludedTopics, excludedIds: input.excludeItemIds, maximumItems: Math.min(input.maximumItems, project.maximumItemsPerRequest), topicFeedback });
  const byId = new Map(eligible.map(item => [item.id, item]));
  return ranked.map(result => {
    const item = byId.get(result.item.id)!;
    return { id: item.id, origin: "first_party", contentType: item.contentType.toLowerCase(), title: item.title, summary: item.summary, url: item.canonicalUrl, imageUrl: item.externalMediaUrl, publisher: { name: item.publication.name, slug: item.publication.slug }, publishedAt: (item.publishedAt ?? item.createdAt).toISOString(), topics: item.topics.map(topic => ({ slug: topic.topic.slug, name: topic.topic.name, confidence: topic.confidence, subcategory: topic.topic.taxonomyNode?.parent ? { slug: topic.topic.taxonomyNode.parent.slug, name: topic.topic.taxonomyNode.parent.name } : null, category: topic.topic.taxonomyNode?.parent?.parent ? { slug: topic.topic.taxonomyNode.parent.parent.slug, name: topic.topic.taxonomyNode.parent.parent.name } : null })), provenance: { kind: "first_party", sourceId: item.publication.id, sourceName: item.publication.name, originalUrl: item.canonicalUrl }, relevanceScore: result.relevanceScore, relevanceExplanation: result.relevanceExplanation };
  });
}

async function externalNews(project: FeedProject, input: UnifiedFeedRequest, resolved: Awaited<ReturnType<typeof resolveProjectTaxonomy>>, topicFeedback: Map<string, number>): Promise<NormalizedItem[]> {
  if (input.origins && !input.origins.includes("external_news")) return [];
  const topicSlugs = resolved.topics.map(topic => topic.slug);
  await refreshRelevantSources(topicSlugs, project.minimumRefreshIntervalMinutes, project.id);
  const articles = await database.externalArticle.findMany({
    where: { status: "ACTIVE", publishedAt: { gte: new Date(Date.now() - input.maximumAgeHours * 3_600_000) }, feedSource: input.sourceSlugs ? { slug: { in: input.sourceSlugs } } : undefined, topics: { some: { topic: { slug: { in: topicSlugs } } } } },
    include: { feedSource: true, topics: { include: { topic: { include: { taxonomyNode: { include: { parent: { include: { parent: true } } } } } } } } }, take: 200,
  });
  const ranked = rankRelevantArticles(articles.map(article => ({ id: article.id, publishedAt: article.publishedAt, title: article.title, description: article.description ?? "", publisher: article.feedSource.slug, contentType: "external_news", taxonomy: article.topics[0]?.topic.taxonomyNode?.parent?.parent?.slug ?? article.topics[0]?.topic.slug ?? "unclassified", sourceQuality: sourceQualityScore(article.feedSource), topics: article.topics.map(topic => ({ slug: topic.topic.slug, score: topic.score, assignmentSource: topic.assignmentSource })) })), resolved.topics, { excludedTopics: input.excludedTopics, excludeArticleIds: input.excludeItemIds, maximumItems: Math.min(input.maximumItems, project.maximumItemsPerRequest), topicFeedback });
  const byId = new Map(articles.map(article => [article.id, article]));
  return ranked.map(result => {
    const item = byId.get(result.article.id)!;
    return { id: item.id, origin: "external_news", contentType: "external_news", title: item.title, summary: item.description, url: item.canonicalUrl, imageUrl: permittedSourceImageUrl(item.feedSource.allowExternalImages,item.imageUrl), publisher: { name: item.feedSource.name, slug: item.feedSource.slug }, publishedAt: item.publishedAt.toISOString(), topics: item.topics.filter(topic => topicSlugs.includes(topic.topic.slug)).map(topic => ({ slug: topic.topic.slug, name: topic.topic.name, confidence: topic.score, subcategory: topic.topic.taxonomyNode?.parent ? { slug: topic.topic.taxonomyNode.parent.slug, name: topic.topic.taxonomyNode.parent.name } : null, category: topic.topic.taxonomyNode?.parent?.parent ? { slug: topic.topic.taxonomyNode.parent.parent.slug, name: topic.topic.taxonomyNode.parent.parent.name } : null })), provenance: { kind: "external_news", sourceId: item.feedSource.id, sourceName: item.feedSource.name, originalUrl: item.canonicalUrl }, relevanceScore: result.relevanceScore, relevanceExplanation: result.relevanceExplanation };
  });
}

async function composeUncached(project: FeedProject, input: UnifiedFeedRequest) {
  const resolved = await resolveProjectTaxonomy(project.id, input.topics, input.classifications);
  if (resolved.unauthorized.length) return { ok: false as const, unauthorized: resolved.unauthorized };
  const feedback = await loadProjectTopicFeedback(project.id, input.externalUserId);
  const [first, news] = await Promise.allSettled([withTimeout(firstParty(project, input, resolved, feedback)), withTimeout(externalNews(project, input, resolved, feedback))]);
  const section = (result: PromiseSettledResult<NormalizedItem[]>): FeedSection => result.status === "fulfilled" ? { status: "complete", items: result.value } : { status: "unavailable", items: [], error: { code: "ORIGIN_UNAVAILABLE", message: "This origin could not be loaded." } };
  const firstPartySection = section(first), newsSection = section(news);
  const items = mergeFeedSections(firstPartySection, newsSection, Math.min(input.maximumItems, project.maximumItemsPerRequest));
  return { ok: true as const, unauthorized: [] as string[], generatedAt: new Date().toISOString(), freshness: { maximumAgeHours: input.maximumAgeHours, cacheTtlSeconds: CACHE_TTL_MS / 1000 }, partial: firstPartySection.status !== "complete" || newsSection.status !== "complete", resolvedTopics: resolved.topics, sections: { firstParty: firstPartySection, externalNews: newsSection }, items };
}

export async function composeUnifiedFeed(project: FeedProject, input: UnifiedFeedRequest) {
  const key = cacheKey(project.id, input), found = cache.get(key);
  if (found && found.expiresAt > Date.now()) return { ...found.value, cache: "hit" as const };
  const value = await composeUncached(project, input);
  if (value.ok) cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value });
  return { ...value, cache: "miss" as const };
}

export function clearUnifiedFeedCache() { cache.clear(); }
