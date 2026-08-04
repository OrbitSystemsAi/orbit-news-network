import type { Prisma } from "@/generated/prisma/client";
import type { ContentSubmissionResponse } from "@/lib/contracts/publishing";

type SubmissionRecord = Prisma.ContentSubmissionGetPayload<{
  include: { publication: true; contributor: true; topics: { include: { topic: true } }; citations: true };
}>;

export function toContentSubmissionResponse(item: SubmissionRecord): ContentSubmissionResponse {
  return {
    id: item.id,
    externalContentId: item.externalContentId,
    contentType: item.contentType,
    title: item.title,
    summary: item.summary,
    body: item.body,
    canonicalUrl: item.canonicalUrl,
    externalMediaUrl: item.externalMediaUrl,
    language: item.language,
    distributionLevel: item.distributionLevel,
    status: item.status,
    submittedAt: item.submittedAt.toISOString(),
    publishedAt: item.publishedAt?.toISOString() ?? null,
    publication: { id: item.publication.id, name: item.publication.name, slug: item.publication.slug },
    contributor: item.contributor ? {
      externalContributorId: item.contributor.externalContributorId,
      displayName: item.contributor.displayName,
      byline: item.contributor.byline,
      profileUrl: item.contributor.profileUrl,
      avatarUrl: item.contributor.avatarUrl,
    } : null,
    topics: item.topics.map(({ topic, weight }) => ({ slug: topic.slug, name: topic.name, weight })),
    citations: item.citations.sort((a, b) => a.citationOrder - b.citationOrder).map((citation) => ({ label: citation.label, url: citation.url, sourceName: citation.sourceName, order: citation.citationOrder })),
  };
}
