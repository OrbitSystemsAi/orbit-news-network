import { apiError } from "@/lib/api/error";
import { apiSuccess } from "@/lib/api/response";
import { database } from "@/lib/database/client";
import { authenticateProject } from "@/server/services/request-auth";
import { taxonomyTree } from "@/server/services/taxonomy";

export async function GET(request: Request) {
  const project = await authenticateProject(request);
  if (!project) return apiError("UNAUTHORIZED", "A valid project API key is required.", 401);
  const permissions = await database.projectTaxonomyPermission.findMany({ where: { projectId: project.id, status: "ACTIVE", taxonomyNode: { status: "ACTIVE" } }, include: { taxonomyNode: { include: { aliases: true, topic: true } } }, orderBy: { taxonomyNode: { name: "asc" } } });
  const nodes = permissions.map(permission => ({ id: permission.taxonomyNode.id, parentId: permission.taxonomyNode.parentId, slug: permission.taxonomyNode.slug, name: permission.taxonomyNode.name, type: permission.taxonomyNode.nodeType.toLowerCase(), description: permission.taxonomyNode.description, aliases: permission.taxonomyNode.aliases.map(alias => alias.alias), legacyTopicSlug: permission.taxonomyNode.topic?.slug ?? null, defaultWeight: permission.defaultWeight, inherited: permission.inherited }));
  return apiSuccess({ version: 1, project: { id: project.id, slug: project.slug }, hierarchy: taxonomyTree(nodes), compatibleTopics: nodes.filter(node => node.type === "topic").map(node => ({ slug: node.slug, name: node.name, defaultWeight: node.defaultWeight })) });
}
