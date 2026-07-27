import { z } from "zod";

export const collectedArticleSchema = z.object({
  externalId: z.string().nullable(),
  title: z.string().min(1),
  description: z.string().default(""),
  canonicalUrl: z.string().url(),
  author: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
  publishedAt: z.date(),
  sourceMetadata: z.record(z.string(), z.unknown()).default({}),
});
export type CollectedArticle = z.infer<typeof collectedArticleSchema>;
export type FeedSourceConfiguration = { feedUrl:string; feedType:"rss"|"atom"|"auto"; name:string };
export interface NewsSourceConnector {
  collect(source: FeedSourceConfiguration): Promise<CollectedArticle[]>;
}
