import { apiError } from "@/lib/api/error";import { apiSuccess } from "@/lib/api/response";import { database } from "@/lib/database/client";import { feedbackRequestSchema } from "@/lib/validation/news";import { authenticateProject } from "@/server/services/request-auth";
export async function POST(request:Request){
 const project=await authenticateProject(request);if(!project)return apiError("UNAUTHORIZED","A valid project API key is required.",401);
 const parsed=feedbackRequestSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return apiError("VALIDATION_ERROR","The feedback request is invalid.",400,parsed.error.issues.map(i=>({path:i.path.join("."),message:i.message})));
 const article=await database.externalArticle.findUnique({where:{id:parsed.data.articleId},select:{id:true}});if(!article)return apiError("ARTICLE_NOT_FOUND","The article was not found.",404);
 const interaction=await database.newsInteraction.create({data:{projectId:project.id,externalUserId:parsed.data.externalUserId,externalArticleId:article.id,interactionType:parsed.data.interaction.toUpperCase() as any}});
 return apiSuccess({id:interaction.id,recorded:true},201);
}
