import type { RequestedTopic } from "./relevance";
import { selectDiverse } from "./curation";

export type ContentCandidate = { id: string; publishedAt: Date; topics: Array<{ slug: string; weight: number }>; title?: string; publisher?: string; contentType?: string; taxonomy?: string };

export function rankContent(items: ContentCandidate[], requested: RequestedTopic[], options: { excludedTopics: string[]; excludedIds: string[]; maximumItems: number; now?: Date; topicFeedback?: Map<string, number> }) {
  const excluded = new Set(options.excludedTopics), ids = new Set(options.excludedIds), requestedMap = new Map(requested.map(topic => [topic.slug, topic])), now = options.now ?? new Date();
  const ranked = items.filter(item => !ids.has(item.id) && !item.topics.some(topic => excluded.has(topic.slug)) && item.topics.some(topic => requestedMap.has(topic.slug))).map(item => {
    let topicScore = 0;
    const matchedTopics: string[] = [];
    for (const topic of item.topics) {
      const signal = requestedMap.get(topic.slug);
      if (signal) {
        matchedTopics.push(topic.slug);
        topicScore += signal.weight * topic.weight * (signal.source === "career" ? 1.25 : signal.source === "network" ? 0.7 : signal.source === "group" ? 0.9 : 1);
      }
    }
    const ageHours = Math.max(0, (now.getTime() - item.publishedAt.getTime()) / 3_600_000);
    const freshness = Math.max(0, 2 - ageHours / 168 * 2);
    const feedback = Math.max(-3, Math.min(3, matchedTopics.reduce((total, slug) => total + (options.topicFeedback?.get(slug) ?? 0), 0)));
    const total = Math.round((topicScore + freshness + feedback) * 100) / 100;
    return { item, relevanceScore: total, relevanceExplanation: { topic: Math.round(topicScore * 100) / 100, freshness: Math.round(freshness * 100) / 100, sourceQuality: 0, feedback: Math.round(feedback * 100) / 100, total, matchedTopics } };
  }).filter(result => result.relevanceScore >= 2).sort((first, second) => second.relevanceScore - first.relevanceScore || second.item.publishedAt.getTime() - first.item.publishedAt.getTime());
  const diverse = selectDiverse(ranked.map(result => ({ ...result, id: result.item.id, title: result.item.title ?? result.item.id, publisher: result.item.publisher ?? "unknown", contentType: result.item.contentType ?? "content", taxonomy: result.item.taxonomy ?? result.relevanceExplanation.matchedTopics[0] ?? "unclassified" })), options.maximumItems);
  return diverse.map(result => ({ item: result.item, relevanceScore: result.relevanceScore, relevanceExplanation: result.relevanceExplanation }));
}
