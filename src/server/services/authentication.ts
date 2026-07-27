import { apiKeyPrefix, verifyApiKey } from "./api-keys";

export type AuthKeyRecord = { id:string; keyHash:string; status:string; scopes:string[]; project:{id:string;slug:string;name:string;status:string;maximumItemsPerRequest:number;minimumRefreshIntervalMinutes:number;organizationId?:string;publicContentAccess?:boolean} };
export type AuthRepository = {
  findByPrefix(prefix:string): Promise<AuthKeyRecord|null>;
  markUsed(id:string, at:Date): Promise<void>;
};

export async function authenticateBearer(authorization: string | null, repository: AuthRepository, secret: string, requiredScope?: string) {
  if (!authorization?.startsWith("Bearer ")) return null;
  const key = authorization.slice(7).trim();
  if (!key.startsWith("onn_")) return null;
  const record = await repository.findByPrefix(apiKeyPrefix(key));
  if (!record || record.status !== "ACTIVE" || record.project.status !== "ACTIVE") return null;
  if (!verifyApiKey(key, record.keyHash, secret)) return null;
  if (requiredScope && !record.scopes.includes(requiredScope)) return null;
  await repository.markUsed(record.id, new Date());
  return {...record.project,scopes:record.scopes};
}
