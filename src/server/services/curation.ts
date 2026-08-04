export type FeedbackInteraction = { interaction: string; occurredAt: Date; topicSlugs: string[] };

const feedbackValues: Record<string, number> = { OPENED: 0.25, SAVED: 0.8, USEFUL: 1, SHARED: 0.8, DISMISSED: -1, NOT_RELEVANT: -1.25 };

export function decayedFeedbackValue(interaction: string, occurredAt: Date, now = new Date(), halfLifeDays = 30) {
  const base = feedbackValues[interaction.toUpperCase()] ?? 0;
  const ageDays = Math.max(0, (now.getTime() - occurredAt.getTime()) / 86_400_000);
  return base * 0.5 ** (ageDays / halfLifeDays);
}

export function topicFeedbackAdjustments(interactions: FeedbackInteraction[], now = new Date()) {
  const values = new Map<string, number>();
  interactions.forEach(record => record.topicSlugs.forEach(slug => values.set(slug, (values.get(slug) ?? 0) + decayedFeedbackValue(record.interaction, record.occurredAt, now))));
  return new Map([...values].map(([slug, value]) => [slug, Math.round(Math.max(-2, Math.min(2, value)) * 100) / 100]));
}

function words(value: string) {
  return new Set(value.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(word => word.length > 2));
}

export function storySimilarity(first: string, second: string) {
  const a = words(first), b = words(second);
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter(word => b.has(word)).length;
  return intersection / new Set([...a, ...b]).size;
}

export type DiversityCandidate = { id: string; title: string; publisher: string; contentType: string; taxonomy: string };

export function selectDiverse<T extends DiversityCandidate>(ranked: T[], maximumItems: number) {
  const publisherDiversityAvailable = new Set(ranked.map(item => item.publisher)).size > 1;
  const typeDiversityAvailable = new Set(ranked.map(item => item.contentType)).size > 1;
  const taxonomyDiversityAvailable = new Set(ranked.map(item => item.taxonomy)).size > 1;
  const publisherLimit = Math.max(2, Math.ceil(maximumItems * 0.5));
  const typeLimit = Math.max(2, Math.ceil(maximumItems * 0.6));
  const taxonomyLimit = Math.max(2, Math.ceil(maximumItems * 0.6));
  const publisherCounts = new Map<string, number>(), typeCounts = new Map<string, number>(), taxonomyCounts = new Map<string, number>();
  const selected: T[] = [];
  for (const candidate of ranked) {
    if (selected.some(item => storySimilarity(item.title, candidate.title) >= 0.72)) continue;
    if (publisherDiversityAvailable && (publisherCounts.get(candidate.publisher) ?? 0) >= publisherLimit) continue;
    if (typeDiversityAvailable && (typeCounts.get(candidate.contentType) ?? 0) >= typeLimit) continue;
    if (taxonomyDiversityAvailable && (taxonomyCounts.get(candidate.taxonomy) ?? 0) >= taxonomyLimit) continue;
    selected.push(candidate);
    publisherCounts.set(candidate.publisher, (publisherCounts.get(candidate.publisher) ?? 0) + 1);
    typeCounts.set(candidate.contentType, (typeCounts.get(candidate.contentType) ?? 0) + 1);
    taxonomyCounts.set(candidate.taxonomy, (taxonomyCounts.get(candidate.taxonomy) ?? 0) + 1);
    if (selected.length === maximumItems) break;
  }
  return selected;
}

export function sourceQualityScore(input: { officialFeedConfirmed?: boolean; termsReviewed?: boolean; consecutiveFailureCount?: number; policyReviewDueAt?: Date | null }, now = new Date()) {
  let score = input.officialFeedConfirmed && input.termsReviewed ? 1 : 0;
  score -= Math.min(0.6, (input.consecutiveFailureCount ?? 0) * 0.15);
  if (input.policyReviewDueAt && input.policyReviewDueAt < now) score -= 0.4;
  return Math.max(0, Math.min(1, Math.round(score * 100) / 100));
}
