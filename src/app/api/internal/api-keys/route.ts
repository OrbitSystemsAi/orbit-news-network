import { apiError } from "@/lib/api/error";
import { apiSuccess } from "@/lib/api/response";
import { database } from "@/lib/database/client";
import { serverEnvironment } from "@/lib/environment/server";
import { isAdminRequest } from "@/server/services/request-auth";
import { API_KEY_SCOPES,generateApiKey,hashApiKey } from "@/server/services/api-keys";
export async function POST(request:Request){
 if(!isAdminRequest(request))return apiError("UNAUTHORIZED","Administrative access is required.",401);
 if(!serverEnvironment.API_KEY_HASH_SECRET)return apiError("SERVER_CONFIGURATION","API key hashing is not configured.",503);
 const body=await request.json().catch(()=>null);const project=await database.project.findUnique({where:{id:body?.projectId}});
 if(!project)return apiError("PROJECT_NOT_FOUND","Project not found.",404);
 const requested=Array.isArray(body?.scopes)?body.scopes.filter((x:unknown):x is string=>typeof x==="string"):[];
 const scopes:string[]=requested.length?requested:["news:read","news:feedback"];
 if(scopes.some(scope=>!API_KEY_SCOPES.includes(scope as never)))return apiError("VALIDATION_ERROR","An unsupported scope was requested.",400);
 const generated=generateApiKey(project.environment==="PRODUCTION"?"production":"development");
 const record=await database.projectApiKey.create({data:{projectId:project.id,name:body?.name||"Development key",environment:project.environment,prefix:generated.prefix,keyHash:hashApiKey(generated.key,serverEnvironment.API_KEY_HASH_SECRET),scopes,status:"ACTIVE"}});
 return apiSuccess({id:record.id,name:record.name,prefix:record.prefix,scopes:record.scopes,key:generated.key,displayOnce:true},201);
}
export async function DELETE(request:Request){if(!isAdminRequest(request))return apiError("UNAUTHORIZED","Administrative access is required.",401);const body=await request.json().catch(()=>null);if(!body?.id)return apiError("VALIDATION_ERROR","Key ID is required.",400);await database.projectApiKey.update({where:{id:body.id},data:{status:"REVOKED",revokedAt:new Date()}});return apiSuccess({revoked:true});}
