export type RequestedTopic = { slug: string; weight: number; source?: string };
export type ScoredArticle = {
  id: string; publishedAt: Date; topics: Array<{slug:string; score:number; assignmentSource?:string}>;
  title?: string; description?: string;
};

const sourceMultiplier: Record<string, number> = { career: 1.25, interest: 1, group: .9, network: .7 };

export function scoreArticle(article: ScoredArticle, requested: RequestedTopic[], now = new Date(), feedback: string[] = []) {
  const requestMap = new Map(requested.map(t => [t.slug, t]));
  let score = 0;
  for (const topic of article.topics) {
    const signal = requestMap.get(topic.slug);
    if (!signal) continue;
    const origin = sourceMultiplier[signal.source ?? "interest"] ?? .8;
    const mapping = topic.assignmentSource === "FEED_MAPPING" || topic.assignmentSource === "feed_mapping" ? 1.1 : 1;
    score += signal.weight * topic.score * origin * mapping;
  }
  const ageHours = Math.max(0, (now.getTime() - article.publishedAt.getTime()) / 3_600_000);
  score += Math.max(0, 4 * (1 - ageHours / 24));
  if (feedback.some(x => x === "DISMISSED" || x === "NOT_RELEVANT")) score -= 4;
  if (feedback.some(x => x === "SAVED" || x === "USEFUL")) score += 2;
  if (feedback.includes("OPENED")) score += 1;
  return Math.round(score * 100) / 100;
}

export function rankRelevantArticles(articles: ScoredArticle[], requested: RequestedTopic[], options: {
  excludedTopics?: string[]; excludeArticleIds?: string[]; maximumItems: number; now?: Date; minimumScore?: number;
}) {
  const excludedTopics = new Set(options.excludedTopics ?? []);
  const excludedIds = new Set(options.excludeArticleIds ?? []);
  return articles
    .filter(a => !excludedIds.has(a.id) && !a.topics.some(t => excludedTopics.has(t.slug)) && a.topics.some(t => requested.some(r => r.slug === t.slug)))
    .map(article => ({ article, relevanceScore: scoreArticle(article, requested, options.now) }))
    .filter(x => x.relevanceScore >= (options.minimumScore ?? 2))
    .sort((a,b) => b.relevanceScore - a.relevanceScore || b.article.publishedAt.getTime() - a.article.publishedAt.getTime())
    .slice(0, options.maximumItems);
}
