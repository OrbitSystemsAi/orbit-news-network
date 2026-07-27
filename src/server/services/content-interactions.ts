import { database } from "@/lib/database/client";
export async function recordContentInteraction(input:{projectId:string;externalUserId:string;contentId:string;interaction:string}){return database.contentInteraction.create({data:{destinationProjectId:input.projectId,externalUserId:input.externalUserId,contentSubmissionId:input.contentId,interactionType:input.interaction.toUpperCase() as never}})}
