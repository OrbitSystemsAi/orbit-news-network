import { database } from "@/lib/database/client";
import { recordContentInteraction } from "./content-interactions";

export class FeedItemNotFoundError extends Error {}

export async function recordFeedInteraction(input: { projectId: string; externalUserId: string; itemType: "first_party" | "external_news"; itemId: string; interaction: string }) {
  if (input.itemType === "first_party") {
    const [delivery, own] = await Promise.all([
      database.distributionDelivery.findUnique({ where: { contentSubmissionId_destinationProjectId: { contentSubmissionId: input.itemId, destinationProjectId: input.projectId } }, select: { id: true } }),
      database.contentSubmission.findFirst({ where: { id: input.itemId, projectId: input.projectId, status: "PUBLISHED" }, select: { id: true } }),
    ]);
    if (!delivery && !own) throw new FeedItemNotFoundError();
    return recordContentInteraction({ projectId: input.projectId, externalUserId: input.externalUserId, contentId: input.itemId, interaction: input.interaction });
  }
  const article = await database.externalArticle.findFirst({ where: { id: input.itemId, status: "ACTIVE" }, select: { id: true } });
  if (!article) throw new FeedItemNotFoundError();
  return database.newsInteraction.create({ data: { projectId: input.projectId, externalUserId: input.externalUserId, externalArticleId: input.itemId, interactionType: input.interaction.toUpperCase() as never } });
}
