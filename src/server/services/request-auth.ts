import { database } from "@/lib/database/client";
import { serverEnvironment } from "@/lib/environment/server";
import { authenticateBearer } from "./authentication";
import { timingSafeEqual } from "node:crypto";
import { accessCookieName, cookieValue, verifyAccessSession } from "@/lib/security/access-session";

export async function authenticateProject(request: Request, requiredScope?: string) {
  if (!serverEnvironment.API_KEY_HASH_SECRET) return null;
  const path=new URL(request.url).pathname;
  const inferredScope=path.includes("/feed/relevant")?"feed:read":requiredScope ?? (path.includes("/news/feedback")?"news:feedback":path.includes("/news/")||path.endsWith("/topics")?"news:read":undefined);
  return authenticateBearer(request.headers.get("authorization"), {
    findByPrefix: prefix => database.projectApiKey.findUnique({
      where:{prefix}, include:{project:{select:{id:true,slug:true,name:true,status:true,organizationId:true,publicContentAccess:true,maximumItemsPerRequest:true,minimumRefreshIntervalMinutes:true}}},
    }),
    markUsed: (id,at) => database.projectApiKey.update({where:{id},data:{lastUsedAt:at}}).then(()=>undefined),
  }, serverEnvironment.API_KEY_HASH_SECRET, inferredScope);
}

export function isAdminRequest(request: Request) {
  const expected = serverEnvironment.ADMIN_ACCESS_KEY;
  if (verifyAccessSession(cookieValue(request.headers.get("cookie"), accessCookieName), expected)) return true;
  const supplied = request.headers.get("x-onn-admin-key");
  if (!expected || !supplied) return false;
  const a=Buffer.from(expected),b=Buffer.from(supplied);
  return a.length===b.length && timingSafeEqual(a,b);
}
