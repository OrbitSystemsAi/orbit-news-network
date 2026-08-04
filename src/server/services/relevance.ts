import { selectDiverse } from "./curation";

export type RequestedTopic = { slug: string; weight: number; source?: string };
export type ScoredArticle = {
  id: string;
  publishedAt: Date;
  topics: Array<{ slug: string; score: number; assignmentSource?: string }>;
  title?: string;
  description?: string;
  publisher?: string;
  contentType?: string;
  taxonomy?: string;
  sourceQuality?: number;
};

export type RelevanceExplanation = { topic: number; freshness: number; sourceQuality: number; feedback: number; total: number; matchedTopics: string[] };
const sourceMultiplier: Record<string, number> = { career: 1.25, interest: 1, group: .9, network: .7 };

export function explainArticleScore(article: ScoredArticle, requested: RequestedTopic[], now = new Date(), topicFeedback = new Map<string, number>()): RelevanceExplanation {
  const requestMap = new Map(requested.map(topic => [topic.slug, topic]));
  const topicScores = new Map<string, number>();
  for (const topic of article.topics) {
    const signal = requestMap.get(topic.slug);
    if (!signal) continue;
    const origin = sourceMultiplier[signal.source ?? "interest"] ?? .8;
    const mapping = topic.assignmentSource === "FEED_MAPPING" || topic.assignmentSource === "feed_mapping" ? 1.1 : 1;
    topicScores.set(topic.slug, Math.max(topicScores.get(topic.slug) ?? 0, signal.weight * topic.score * origin * mapping));
  }
  const topic = [...topicScores.values()].reduce((total, contribution) => total + contribution, 0);
  const ageHours = Math.max(0, (now.getTime() - article.publishedAt.getTime()) / 3_600_000);
  const freshness = Math.max(0, 4 * (1 - ageHours / 24));
  const sourceQuality = (article.sourceQuality ?? 0) * 2;
  const feedback = Math.max(-3, Math.min(3, [...topicScores.keys()].reduce((total, slug) => total + (topicFeedback.get(slug) ?? 0), 0)));
  const total = Math.round((topic + freshness + sourceQuality + feedback) * 100) / 100;
  return { topic: Math.round(topic * 100) / 100, freshness: Math.round(freshness * 100) / 100, sourceQuality: Math.round(sourceQuality * 100) / 100, feedback: Math.round(feedback * 100) / 100, total, matchedTopics: [...topicScores.keys()] };
}

export function scoreArticle(article: ScoredArticle, requested: RequestedTopic[], now = new Date(), feedback: string[] = []) {
  const directFeedback = new Map(article.topics.map(topic => [topic.slug, feedback.some(value => value === "DISMISSED" || value === "NOT_RELEVANT") ? -3 : feedback.some(value => value === "SAVED" || value === "USEFUL") ? 2 : feedback.includes("OPENED") ? 1 : 0]));
  return explainArticleScore(article, requested, now, directFeedback).total;
}

export function rankRelevantArticles(articles: ScoredArticle[], requested: RequestedTopic[], options: { excludedTopics?: string[]; excludeArticleIds?: string[]; maximumItems: number; now?: Date; minimumScore?: number; topicFeedback?: Map<string, number> }) {
  const excludedTopics = new Set(options.excludedTopics ?? []), excludedIds = new Set(options.excludeArticleIds ?? []), now = options.now ?? new Date();
  const ranked = articles
    .filter(article => !excludedIds.has(article.id) && !article.topics.some(topic => excludedTopics.has(topic.slug)) && article.topics.some(topic => requested.some(signal => signal.slug === topic.slug)))
    .map(article => ({ article, relevanceExplanation: explainArticleScore(article, requested, now, options.topicFeedback), relevanceScore: explainArticleScore(article, requested, now, options.topicFeedback).total }))
    .filter(result => result.relevanceScore >= (options.minimumScore ?? 2))
    .sort((first, second) => second.relevanceScore - first.relevanceScore || second.article.publishedAt.getTime() - first.article.publishedAt.getTime());
  const diverse = selectDiverse(ranked.map(result => ({ ...result, id: result.article.id, title: result.article.title ?? result.article.id, publisher: result.article.publisher ?? "unknown", contentType: result.article.contentType ?? "external_news", taxonomy: result.article.taxonomy ?? result.relevanceExplanation.matchedTopics[0] ?? "unclassified" })), options.maximumItems);
  return diverse.map(result => ({ article: result.article, relevanceScore: result.relevanceScore, relevanceExplanation: result.relevanceExplanation }));
}
