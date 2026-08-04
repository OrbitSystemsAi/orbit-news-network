import { describe, expect, it } from "vitest";
import evaluation from "./fixtures/relevance-evaluation.json";
import { decayedFeedbackValue, selectDiverse, sourceQualityScore, storySimilarity, topicFeedbackAdjustments } from "@/server/services/curation";
import { rankRelevantArticles } from "@/server/services/relevance";

describe("feed curation", () => {
  it("suppresses near-duplicate stories", () => expect(storySimilarity("NASA launches new lunar relay system", "NASA launches lunar relay system")).toBeGreaterThan(.72));

  it("uses alternatives for publisher and taxonomy diversity", () => {
    const selected = selectDiverse([
      { id: "a", title: "Alpha", publisher: "one", contentType: "article", taxonomy: "tech" },
      { id: "b", title: "Beta", publisher: "one", contentType: "article", taxonomy: "tech" },
      { id: "c", title: "Gamma", publisher: "one", contentType: "article", taxonomy: "tech" },
      { id: "d", title: "Delta", publisher: "two", contentType: "research", taxonomy: "careers" },
    ], 3);
    expect(selected.map(item => item.id)).toEqual(["a", "b", "d"]);
  });

  it("decays and bounds project-scoped topic feedback", () => {
    const now = new Date("2026-08-04T00:00:00Z");
    expect(decayedFeedbackValue("USEFUL", new Date("2026-07-05T00:00:00Z"), now)).toBeCloseTo(.5);
    const adjustments = topicFeedbackAdjustments(Array.from({ length: 10 }, () => ({ interaction: "NOT_RELEVANT", occurredAt: now, topicSlugs: ["technology"] })), now);
    expect(adjustments.get("technology")).toBe(-2);
  });

  it("rewards reviewed reliable sources without overpowering topic relevance", () => {
    expect(sourceQualityScore({ officialFeedConfirmed: true, termsReviewed: true, consecutiveFailureCount: 0 })).toBe(1);
    expect(sourceQualityScore({ officialFeedConfirmed: true, termsReviewed: true, consecutiveFailureCount: 5 })).toBeLessThan(1);
  });

  it.each(evaluation.cases)("passes reviewed evaluation: $name", testCase => {
    const now = new Date("2026-08-04T00:00:00Z");
    const topic = testCase.requested[0].slug;
    const candidates = [
      { id: testCase.expectedFirst, title: "Relevant result", publishedAt: new Date("2026-08-03T20:00:00Z"), publisher: "one", contentType: "article", taxonomy: topic, topics: [{ slug: topic, score: 1, assignmentSource: "FEED_MAPPING" }] },
      { id: "unrelated-fresh", title: "Unrelated result", publishedAt: new Date("2026-08-03T23:59:00Z"), publisher: "two", contentType: "article", taxonomy: "other", topics: [{ slug: "other", score: 1 }] },
    ];
    const ranked = rankRelevantArticles(candidates, testCase.requested, { maximumItems: 4, now, topicFeedback: new Map([[topic, -2]]) });
    expect(ranked[0].article.id).toBe(testCase.expectedFirst);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].relevanceExplanation.matchedTopics).toEqual([topic]);
  });
});
