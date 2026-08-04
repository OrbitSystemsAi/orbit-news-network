import { describe, expect, it, vi } from "vitest";
import { unifiedFeedSchema } from "@/lib/validation/content";
import { API_KEY_SCOPES } from "@/server/services/api-keys";
import { createFeedClient } from "@/lib/contracts/feed";
import { mergeFeedSections } from "@/server/services/unified-feed";

describe("unified feed contract", () => {
  it("accepts bounded filters and applies defaults", () => {
    const parsed = unifiedFeedSchema.parse({
      externalUserId: "member-1",
      classifications: [{ slug: "technology-and-data", weight: 8 }],
      origins: ["first_party", "external_news"],
      contentTypes: ["article"],
      publicationSlugs: ["career-pivot"],
      sourceSlugs: ["nasa"],
      distributionLevels: ["application", "network"],
    });
    expect(parsed.maximumItems).toBe(12);
    expect(parsed.maximumAgeHours).toBe(24);
  });

  it("rejects unknown fields and requests without taxonomy signals", () => {
    expect(unifiedFeedSchema.safeParse({ externalUserId: "member-1" }).success).toBe(false);
    expect(unifiedFeedSchema.safeParse({ externalUserId: "member-1", topics: [{ slug: "careers", weight: 8 }], projectId: "other" }).success).toBe(false);
  });

  it("bounds payload collections and item maximums", () => {
    expect(unifiedFeedSchema.safeParse({ externalUserId: "member-1", topics: [{ slug: "careers", weight: 8 }], maximumItems: 101 }).success).toBe(false);
    expect(unifiedFeedSchema.safeParse({ externalUserId: "member-1", topics: Array.from({ length: 31 }, (_, index) => ({ slug: `topic-${index}`, weight: 1 })) }).success).toBe(false);
  });

  it("publishes separate read and feedback scopes", () => {
    expect(API_KEY_SCOPES).toContain("feed:read");
    expect(API_KEY_SCOPES).toContain("feed:feedback");
  });

  it("normalizes composition order and preserves available partial results", () => {
    const item = (id: string, relevanceScore: number, origin: "first_party" | "external_news") => ({ id, origin, contentType: origin, title: id, summary: null, url: null, imageUrl: null, publisher: { name: "Publisher", slug: "publisher" }, publishedAt: "2026-08-04T00:00:00.000Z", topics: [], provenance: { kind: origin, sourceId: "source", sourceName: "Publisher", originalUrl: null }, relevanceScore, relevanceExplanation: {} });
    const items = mergeFeedSections(
      { status: "complete", items: [item("first", 8, "first_party")] },
      { status: "unavailable", items: [], error: { code: "ORIGIN_UNAVAILABLE", message: "Unavailable" } },
      4,
    );
    expect(items.map(result => result.id)).toEqual(["first"]);
  });

  it("provides a server client for retrieval and feedback", async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: { items: [] }, meta: { requestId: "r1", timestamp: "t" } }) })
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ data: { id: "i1", recorded: true }, meta: { requestId: "r2", timestamp: "t" } }) });
    const client = createFeedClient({ baseUrl: "https://onn.example/", apiKey: "secret", fetch: fetch as never });
    await client.relevant(unifiedFeedSchema.parse({ externalUserId: "member-1", topics: [{ slug: "careers", weight: 8 }] }));
    await client.feedback({ externalUserId: "member-1", itemType: "first_party", itemId: "content-1", interaction: "shown" });
    expect(fetch).toHaveBeenNthCalledWith(1, "https://onn.example/api/v1/feed/relevant", expect.objectContaining({ method: "POST", headers: expect.objectContaining({ authorization: "Bearer secret" }) }));
    expect(fetch).toHaveBeenNthCalledWith(2, "https://onn.example/api/v1/feed/feedback", expect.objectContaining({ method: "POST" }));
  });

  it("surfaces stable API errors", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({ error: { code: "RATE_LIMITED", message: "Slow down" } }) });
    const client = createFeedClient({ baseUrl: "https://onn.example", apiKey: "secret", fetch: fetch as never });
    await expect(client.relevant(unifiedFeedSchema.parse({ externalUserId: "member-1", topics: [{ slug: "careers", weight: 8 }] }))).rejects.toMatchObject({ code: "RATE_LIMITED", status: 429 });
  });
});
