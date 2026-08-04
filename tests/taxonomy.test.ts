import { describe, expect, it } from "vitest";
import { expandTaxonomySignals, taxonomyTree, type TaxonomyRecord } from "@/server/services/taxonomy";

const nodes: TaxonomyRecord[] = [
  { id: "category", parentId: null, slug: "work-and-careers", nodeType: "CATEGORY", status: "ACTIVE", aliases: [] },
  { id: "subcategory", parentId: "category", slug: "career-development", nodeType: "SUBCATEGORY", status: "ACTIVE", aliases: [] },
  { id: "careers", parentId: "subcategory", slug: "careers", nodeType: "TOPIC", status: "ACTIVE", topic: { slug: "careers" }, aliases: [{ alias: "career-growth" }] },
  { id: "employment", parentId: "subcategory", slug: "employment", nodeType: "TOPIC", status: "ACTIVE", topic: { slug: "employment" }, aliases: [] },
];

describe("hierarchical taxonomy", () => {
  it("expands an authorized category into compatible topic signals", () => {
    const result = expandTaxonomySignals([{ slug: "work-and-careers", weight: 8 }], nodes, new Set(nodes.map(node => node.id)), new Set(["careers", "employment"]));
    expect(result.unauthorized).toEqual([]);
    expect(result.topics).toEqual([{ slug: "careers", weight: 8, source: undefined }, { slug: "employment", weight: 8, source: undefined }]);
  });

  it("resolves aliases and enforces project permissions", () => {
    expect(expandTaxonomySignals([{ slug: "career-growth", weight: 5 }], nodes, new Set(["careers"]), new Set(["careers"])).topics[0].slug).toBe("careers");
    expect(expandTaxonomySignals([{ slug: "work-and-careers", weight: 5 }], nodes, new Set(["careers"]), new Set(["careers"])).unauthorized).toEqual(["work-and-careers"]);
  });

  it("builds a stable category, subcategory, and topic tree", () => {
    const tree = taxonomyTree(nodes);
    expect(tree[0].children[0].children).toHaveLength(2);
  });
});
