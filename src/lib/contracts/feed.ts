import type { UnifiedFeedRequest } from "@/lib/validation/content";
import type { OnnApiFailure, OnnApiSuccess } from "./publishing";

export type FeedOrigin = "first_party" | "external_news";
export type FeedTopic = { slug: string; name: string; confidence: number; category: { slug: string; name: string } | null; subcategory: { slug: string; name: string } | null };
export type FeedItem = {
  id: string;
  origin: FeedOrigin;
  contentType: string;
  title: string;
  summary: string | null;
  url: string | null;
  imageUrl: string | null;
  publisher: { name: string; slug: string };
  publishedAt: string;
  topics: FeedTopic[];
  provenance: { kind: FeedOrigin; sourceId: string; sourceName: string; originalUrl: string | null };
  relevanceScore: number;
  relevanceExplanation: unknown;
};
export type FeedSection = { status: "complete" | "unavailable"; items: FeedItem[]; error?: { code: string; message: string } };
export type UnifiedFeedResponse = {
  project: { id: string; slug: string; name: string };
  generatedAt: string;
  freshness: { maximumAgeHours: number; cacheTtlSeconds: number };
  partial: boolean;
  cache: "hit" | "miss";
  resolvedTopics: Array<{ slug: string; weight: number; source?: string }>;
  sections: { firstParty: FeedSection; externalNews: FeedSection };
  items: FeedItem[];
  quota: { remainingToday: number };
};
export type FeedFeedbackRequest = { externalUserId: string; itemType: FeedOrigin; itemId: string; interaction: "shown" | "opened" | "saved" | "dismissed" | "useful" | "not_relevant" | "shared" };

export function createFeedClient(options: { baseUrl: string; apiKey: string; fetch?: typeof globalThis.fetch }) {
  const request = options.fetch ?? globalThis.fetch;
  const baseUrl = options.baseUrl.replace(/\/$/, "");
  async function post<T>(path: string, body: unknown): Promise<T> {
    const response = await request(`${baseUrl}${path}`, { method: "POST", headers: { authorization: `Bearer ${options.apiKey}`, "content-type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json() as OnnApiSuccess<T> | OnnApiFailure;
    if (!response.ok || !("data" in payload)) {
      const error = "error" in payload ? payload.error : { code: "INVALID_RESPONSE", message: "ONN returned an invalid response." };
      throw Object.assign(new Error(error.message), { code: error.code, status: response.status, details: error.details });
    }
    return payload.data;
  }
  return {
    relevant: (body: UnifiedFeedRequest) => post<UnifiedFeedResponse>("/api/v1/feed/relevant", body),
    feedback: (body: FeedFeedbackRequest) => post<{ id: string; recorded: true }>("/api/v1/feed/feedback", body),
  };
}
