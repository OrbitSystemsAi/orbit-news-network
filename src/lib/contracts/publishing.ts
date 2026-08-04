import type { ContentSubmissionRequest } from "@/lib/validation/content";

export type ContentStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "PUBLISHED" | "PAUSED" | "ARCHIVED";

export type ContentSubmissionResponse = {
  id: string;
  externalContentId: string;
  contentType: string;
  title: string;
  summary: string | null;
  body: string;
  canonicalUrl: string | null;
  externalMediaUrl: string | null;
  language: string;
  distributionLevel: string;
  status: ContentStatus;
  submittedAt: string;
  publishedAt: string | null;
  publication: { id: string; name: string; slug: string };
  contributor: { externalContributorId: string; displayName: string | null; byline: string | null; profileUrl: string | null; avatarUrl: string | null } | null;
  topics: Array<{ slug: string; name: string; weight: number }>;
  citations: Array<{ label: string; url: string; sourceName: string | null; order: number }>;
};

export type OnnApiSuccess<T> = { data: T; meta: { requestId: string; timestamp: string } };
export type OnnApiFailure = { error: { code: string; message: string; details?: Array<Record<string, unknown>> }; meta?: { requestId?: string; timestamp?: string } };

export type PublishingClientOptions = { baseUrl: string; apiKey: string; fetch?: typeof globalThis.fetch };

export function createPublishingClient(options: PublishingClientOptions) {
  const request = options.fetch ?? globalThis.fetch;
  const baseUrl = options.baseUrl.replace(/\/$/, "");
  return {
    async submit(content: ContentSubmissionRequest, idempotencyKey: string): Promise<ContentSubmissionResponse> {
      const response = await request(`${baseUrl}/api/v1/content/submissions`, {
        method: "POST",
        headers: { authorization: `Bearer ${options.apiKey}`, "content-type": "application/json", "idempotency-key": idempotencyKey },
        body: JSON.stringify(content),
      });
      const payload = await response.json() as OnnApiSuccess<ContentSubmissionResponse> | OnnApiFailure;
      if (!response.ok || !("data" in payload)) {
        const error = "error" in payload ? payload.error : { code: "INVALID_RESPONSE", message: "ONN returned an invalid response." };
        throw Object.assign(new Error(error.message), { code: error.code, status: response.status, details: error.details });
      }
      return payload.data;
    },
  };
}
