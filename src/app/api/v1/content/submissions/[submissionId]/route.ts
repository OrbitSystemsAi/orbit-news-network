import { apiError } from "@/lib/api/error";
import { apiSuccess } from "@/lib/api/response";
import { database } from "@/lib/database/client";
import { authenticateProject } from "@/server/services/request-auth";
import { canProjectAccessContent } from "@/server/services/content-access";

export async function GET(request:Request,{params}:{params:Promise<{submissionId:string}>}){
 const project=await authenticateProject(request,"content:read");
 if(!project)return apiError("UNAUTHORIZED","A content:read project key is required.",401);
 const {submissionId}=await params;
 const item=await database.contentSubmission.findUnique({where:{id:submissionId},include:{project:{include:{organization:true}},publication:true,contributor:true,topics:{include:{topic:true}},citations:true,statusHistory:true,moderationDecisions:true}});
 if(!item)return apiError("CONTENT_NOT_FOUND","Content was not found.",404);
 if(item.projectId===project.id)return apiSuccess(item);
 const rules=await database.distributionRule.findMany({where:{projectId:item.projectId,status:"ACTIVE",OR:[{publicationId:item.publicationId},{publicationId:null}]},include:{targets:true}});
 const allowed=canProjectAccessContent({...item,distributionRuleTargets:rules.flatMap(r=>r.targets.filter(t=>t.status==="ACTIVE").map(t=>t.destinationProjectId))},{id:project.id,organizationId:project.organizationId??"",status:project.status,publicContentAccess:project.publicContentAccess??false});
 if(!allowed)return apiError("CONTENT_NOT_FOUND","Content was not found.",404);
 return apiSuccess({id:item.id,contentType:item.contentType,title:item.title,summary:item.summary,body:item.body,canonicalUrl:item.canonicalUrl,externalMediaUrl:item.externalMediaUrl,language:item.language,distributionLevel:item.distributionLevel,publishedAt:item.publishedAt,project:{id:item.project.id,name:item.project.name,slug:item.project.slug},publication:item.publication,contributor:item.contributor,topics:item.topics,citations:item.citations});
}
