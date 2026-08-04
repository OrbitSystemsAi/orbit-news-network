import { z } from "zod";

const httpUrl = z.string().url().refine((value) => ["http:", "https:"].includes(new URL(value).protocol), "URL must use HTTP or HTTPS.");
const httpsUrl = z.string().url().refine((value) => new URL(value).protocol === "https:", "URL must use HTTPS.");
const slug = z.string().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const classificationSlug = z.string().min(2).max(100).regex(/^[a-z0-9]+(?:[ -][a-z0-9]+)*$/);
const jsonValue: z.ZodType<unknown> = z.lazy(() => z.union([z.string(), z.number().finite(), z.boolean(), z.null(), z.array(jsonValue), z.record(z.string(), jsonValue)]));

export const contentTypes = ["article", "announcement", "insight", "research", "event", "product_update", "alert", "press_release"] as const;
export const distributionLevels = ["private", "profile", "application", "network", "partner", "public"] as const;

export const contributorSchema = z.object({
  externalContributorId: z.string().min(1).max(200),
  displayName: z.string().max(160).optional(),
  byline: z.string().max(240).optional(),
  profileUrl: httpsUrl.optional(),
  avatarUrl: httpsUrl.nullable().optional(),
}).strict();

export const citationSchema = z.object({
  label: z.string().min(1).max(200),
  url: httpsUrl,
  sourceName: z.string().max(200).optional(),
}).strict();

export const submissionSchema = z.object({
  externalContentId: z.string().min(1).max(200),
  publicationSlug: z.string().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  contentType: z.enum(contentTypes),
  title: z.string().min(1).max(Number(process.env.CONTENT_MAX_TITLE_LENGTH ?? 200)),
  summary: z.string().max(Number(process.env.CONTENT_MAX_SUMMARY_LENGTH ?? 1000)).optional(),
  body: z.string().min(1).max(Number(process.env.CONTENT_MAX_BODY_LENGTH ?? 50000)),
  canonicalUrl: httpUrl.optional(),
  externalMediaUrl: httpsUrl.optional(),
  language: z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/).default(process.env.DEFAULT_LANGUAGE ?? "en"),
  distributionLevel: z.enum(distributionLevels),
  contributor: contributorSchema.optional(),
  topics: z.array(z.object({ slug, weight: z.number().min(0).max(10) }).strict()).min(1).max(30),
  citations: z.array(citationSchema).max(30).default([]),
  metadata: z.record(z.string(), jsonValue).default({}).refine((value) => JSON.stringify(value).length <= 10_000, "Metadata must not exceed 10,000 serialized characters."),
}).strict().superRefine((value, context) => {
  const seen = new Set<string>();
  value.topics.forEach((topic, index) => {
    if (seen.has(topic.slug)) context.addIssue({ code: "custom", path: ["topics", index, "slug"], message: "Topic slugs must be unique." });
    seen.add(topic.slug);
  });
});

export const idempotencyKeySchema = z.string().min(1).max(200).regex(/^[\x21-\x7E]+$/, "Idempotency key must contain visible ASCII characters only.");

export const relevantContentSchema = z.object({ externalUserId: z.string().min(1).max(200), topics: z.array(z.object({ slug, weight: z.number().min(0).max(10), source: z.enum(["career", "interest", "group", "network"]).optional() })).default([]), classifications: z.array(z.object({ slug: classificationSlug, weight: z.number().min(0).max(10), source: z.enum(["career", "interest", "group", "network"]).optional() })).default([]), excludedTopics: z.array(slug).default([]), excludeContentIds: z.array(z.string()).default([]), contentTypes: z.array(z.enum(contentTypes)).optional(), maximumItems: z.number().int().min(1).max(100).default(8) }).superRefine((value, context) => { if (!value.topics.length && !value.classifications.length) context.addIssue({ code: "custom", path: ["topics"], message: "Provide at least one topic or classification." }); });
export const contentFeedbackSchema = z.object({ externalUserId: z.string().min(1).max(200), contentId: z.string().min(1), interaction: z.enum(["shown", "opened", "saved", "dismissed", "useful", "not_relevant", "shared"]) });
export const feedFeedbackSchema = z.object({ externalUserId: z.string().min(1).max(200), itemType: z.enum(["first_party", "external_news"]), itemId: z.string().min(1), interaction: z.enum(["shown", "opened", "saved", "dismissed", "useful", "not_relevant", "shared"]) });

const feedSignalSchema = z.object({
  slug: classificationSlug,
  weight: z.number().min(0).max(10),
  source: z.enum(["career", "interest", "group", "network"]).optional(),
}).strict();

export const unifiedFeedSchema = z.object({
  externalUserId: z.string().min(1).max(200),
  topics: z.array(feedSignalSchema).max(30).default([]),
  classifications: z.array(feedSignalSchema).max(20).default([]),
  excludedTopics: z.array(slug).max(30).default([]),
  excludeItemIds: z.array(z.string().min(1).max(100)).max(100).default([]),
  origins: z.array(z.enum(["first_party", "external_news"])).min(1).max(2).optional(),
  contentTypes: z.array(z.enum(contentTypes)).max(contentTypes.length).optional(),
  publicationSlugs: z.array(slug).max(30).optional(),
  sourceSlugs: z.array(slug).max(30).optional(),
  distributionLevels: z.array(z.enum(distributionLevels)).max(distributionLevels.length).optional(),
  maximumItems: z.number().int().min(1).max(100).default(12),
  maximumAgeHours: z.number().int().min(1).max(168).default(24),
}).strict().superRefine((value, context) => {
  if (!value.topics.length && !value.classifications.length) context.addIssue({ code: "custom", path: ["topics"], message: "Provide at least one topic or classification." });
});

export type UnifiedFeedRequest = z.infer<typeof unifiedFeedSchema>;

export type ContentSubmissionRequest = z.infer<typeof submissionSchema>;
export type ContentContributorInput = z.infer<typeof contributorSchema>;
export type ContentCitationInput = z.infer<typeof citationSchema>;
