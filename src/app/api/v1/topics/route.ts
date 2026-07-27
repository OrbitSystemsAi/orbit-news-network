import { apiError } from "@/lib/api/error";
import { apiSuccess } from "@/lib/api/response";
import { database } from "@/lib/database/client";
import { authenticateProject } from "@/server/services/request-auth";
export async function GET(request:Request){
 const project=await authenticateProject(request); if(!project)return apiError("UNAUTHORIZED","A valid project API key is required.",401);
 const topics=await database.projectTopic.findMany({where:{projectId:project.id,status:"ACTIVE",topic:{status:"ACTIVE"}},include:{topic:true},orderBy:{topic:{name:"asc"}}});
 return apiSuccess(topics.map(x=>({slug:x.topic.slug,name:x.topic.name,description:x.topic.description,defaultWeight:x.defaultWeight})));
}
