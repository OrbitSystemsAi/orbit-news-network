import { database } from "@/lib/database/client";

export type TaxonomySignal = { slug: string; weight: number; source?: "career" | "interest" | "group" | "network" };
export type TaxonomyRecord = { id: string; parentId: string | null; slug: string; nodeType: string; status: string; topic?: { slug: string } | null; aliases?: Array<{ alias: string }> };

export function expandTaxonomySignals(signals: TaxonomySignal[], nodes: TaxonomyRecord[], permittedNodeIds: Set<string>, permittedTopicSlugs: Set<string>) {
  const byId = new Map(nodes.map(node => [node.id, node]));
  const bySlug = new Map<string, TaxonomyRecord>();
  nodes.forEach(node => {
    bySlug.set(node.slug, node);
    node.aliases?.forEach(alias => bySlug.set(alias.alias.toLowerCase(), node));
  });
  const children = new Map<string, TaxonomyRecord[]>();
  nodes.forEach(node => { if (node.parentId) children.set(node.parentId, [...(children.get(node.parentId) ?? []), node]); });
  const expanded = new Map<string, TaxonomySignal>();
  const unauthorized: string[] = [];

  function descendants(node: TaxonomyRecord): TaxonomyRecord[] {
    return [node, ...(children.get(node.id) ?? []).flatMap(descendants)];
  }

  for (const signal of signals) {
    const node = bySlug.get(signal.slug.toLowerCase());
    if (!node || node.status !== "ACTIVE" || !permittedNodeIds.has(node.id)) { unauthorized.push(signal.slug); continue; }
    const topicNodes = descendants(node).filter(candidate => candidate.nodeType === "TOPIC" && candidate.topic && permittedTopicSlugs.has(candidate.topic.slug));
    if (!topicNodes.length) { unauthorized.push(signal.slug); continue; }
    topicNodes.forEach(topicNode => {
      const slug = topicNode.topic!.slug;
      const prior = expanded.get(slug);
      if (!prior || signal.weight > prior.weight) expanded.set(slug, { slug, weight: signal.weight, source: signal.source });
    });
  }
  return { topics: [...expanded.values()], unauthorized: [...new Set(unauthorized)], byId };
}

export async function resolveProjectTaxonomy(projectId: string, directTopics: TaxonomySignal[], classifications: TaxonomySignal[]) {
  const [nodes, permissions, topicPermissions] = await Promise.all([
    database.taxonomyNode.findMany({ include: { topic: { select: { slug: true } }, aliases: { select: { alias: true } } } }),
    database.projectTaxonomyPermission.findMany({ where: { projectId, status: "ACTIVE" }, select: { taxonomyNodeId: true } }),
    database.projectTopic.findMany({ where: { projectId, status: "ACTIVE", topic: { status: "ACTIVE" } }, include: { topic: true } }),
  ]);
  const permittedTopicSlugs = new Set(topicPermissions.map(permission => permission.topic.slug));
  const permittedNodeIds = new Set(permissions.map(permission => permission.taxonomyNodeId));
  const direct = directTopics.filter(signal => permittedTopicSlugs.has(signal.slug));
  const unauthorizedDirect = directTopics.filter(signal => !permittedTopicSlugs.has(signal.slug)).map(signal => signal.slug);
  const hierarchical = expandTaxonomySignals(classifications, nodes, permittedNodeIds, permittedTopicSlugs);
  const merged = new Map(direct.map(signal => [signal.slug, signal]));
  hierarchical.topics.forEach(signal => { if (!merged.has(signal.slug) || signal.weight > merged.get(signal.slug)!.weight) merged.set(signal.slug, signal); });
  return { topics: [...merged.values()], unauthorized: [...new Set([...unauthorizedDirect, ...hierarchical.unauthorized])] };
}

export function taxonomyTree<T extends { id: string; parentId: string | null }>(nodes: T[]) {
  const children = new Map<string, T[]>();
  nodes.forEach(node => { if (node.parentId) children.set(node.parentId, [...(children.get(node.parentId) ?? []), node]); });
  const build = (node: T): T & { children: Array<T & { children: unknown[] }> } => ({ ...node, children: (children.get(node.id) ?? []).map(build) });
  return nodes.filter(node => !node.parentId).map(build);
}
