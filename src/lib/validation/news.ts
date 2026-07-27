import { z } from "zod";

export const requestedTopicSchema = z.object({
  slug: z.string().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  weight: z.number().min(0).max(10),
  source: z.enum(["career","interest","group","network"]).optional(),
});
export const relevantNewsRequestSchema = z.object({
  externalUserId: z.string().min(1).max(200),
  topics: z.array(requestedTopicSchema).min(1).max(30),
  excludedTopics: z.array(z.string().min(2).max(80)).max(30).default([]),
  excludeArticleIds: z.array(z.string().min(1).max(100)).max(100).default([]),
  maximumItems: z.number().int().min(1).max(100).optional(),
});
export const feedbackRequestSchema = z.object({
  externalUserId: z.string().min(1).max(200),
  articleId: z.string().min(1).max(100),
  interaction: z.enum(["shown","opened","saved","dismissed","useful","not_relevant"]),
});
export const sourceInputSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  feedUrl: z.string().url().refine(v => ["http:","https:"].includes(new URL(v).protocol)),
  websiteUrl: z.string().url().optional(),
  feedType: z.enum(["rss","atom","auto"]).default("auto"),
  minimumRefreshIntervalMinutes: z.number().int().min(15).max(1440).default(30),
  topicSlugs: z.array(z.string()).default([]),
});
