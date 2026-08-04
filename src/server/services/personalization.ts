import { database } from "@/lib/database/client";
import { topicFeedbackAdjustments } from "./curation";

export async function loadProjectTopicFeedback(projectId: string, externalUserId: string, now = new Date()) {
  const cutoff = new Date(now.getTime() - 90 * 86_400_000);
  const [news, content] = await Promise.all([
    database.newsInteraction.findMany({ where: { projectId, externalUserId, createdAt: { gte: cutoff } }, select: { interactionType: true, createdAt: true, externalArticle: { select: { topics: { select: { topic: { select: { slug: true } } } } } } }, orderBy: { createdAt: "desc" }, take: 250 }),
    database.contentInteraction.findMany({ where: { destinationProjectId: projectId, externalUserId, createdAt: { gte: cutoff } }, select: { interactionType: true, createdAt: true, contentSubmission: { select: { topics: { select: { topic: { select: { slug: true } } } } } } }, orderBy: { createdAt: "desc" }, take: 250 }),
  ]);
  return topicFeedbackAdjustments([
    ...news.map(record => ({ interaction: record.interactionType, occurredAt: record.createdAt, topicSlugs: record.externalArticle.topics.map(topic => topic.topic.slug) })),
    ...content.map(record => ({ interaction: record.interactionType, occurredAt: record.createdAt, topicSlugs: record.contentSubmission.topics.map(topic => topic.topic.slug) })),
  ], now);
}
