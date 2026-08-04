import { z } from "zod";
import { apiError } from "@/lib/api/error";
import { apiSuccess } from "@/lib/api/response";
import { database } from "@/lib/database/client";
import { isAdminRequest } from "@/server/services/request-auth";
import { taxonomyTree } from "@/server/services/taxonomy";

const updateSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  status: z.enum(["ACTIVE", "DEPRECATED", "DISABLED"]).optional(),
  replacedById: z.string().min(1).nullable().optional(),
  aliases: z.array(z.string().trim().min(2).max(100)).max(20).optional(),
}).strict();

export async function GET(request: Request) {
  if (!await isAdminRequest(request)) return apiError("UNAUTHORIZED", "Administrative access is required.", 401);
  const nodes = await database.taxonomyNode.findMany({ include: { topic: true, aliases: true, projectPermissions: { include: { project: { select: { name: true, slug: true } } } } }, orderBy: [{ nodeType: "asc" }, { name: "asc" }] });
  return apiSuccess({ version: 1, hierarchy: taxonomyTree(nodes) });
}

export async function PATCH(request: Request) {
  if (!await isAdminRequest(request)) return apiError("UNAUTHORIZED", "Administrative access is required.", 401);
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("VALIDATION_ERROR", "The taxonomy update is invalid.", 400, parsed.error.issues.map(issue => ({ path: issue.path.join("."), message: issue.message })));
  const { id, aliases, ...data } = parsed.data;
  if (data.status === "DEPRECATED" && !data.replacedById) return apiError("REPLACEMENT_REQUIRED", "Deprecated classifications require a replacement node.", 409);
  const node = await database.taxonomyNode.findUnique({ where: { id } });
  if (!node) return apiError("CLASSIFICATION_NOT_FOUND", "The classification was not found.", 404);
  if (data.replacedById === id) return apiError("INVALID_REPLACEMENT", "A classification cannot replace itself.", 409);
  const updated = await database.$transaction(async tx => {
    const result = await tx.taxonomyNode.update({ where: { id }, data: { ...data, governanceVersion: { increment: 1 } } });
    if (aliases) {
      await tx.taxonomyAlias.deleteMany({ where: { nodeId: id } });
      if (aliases.length) await tx.taxonomyAlias.createMany({ data: [...new Set(aliases.map(alias => alias.toLowerCase()))].map(alias => ({ nodeId: id, alias })) });
    }
    return result;
  });
  return apiSuccess(updated);
}
