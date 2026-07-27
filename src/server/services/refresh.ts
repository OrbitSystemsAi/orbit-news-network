import { database } from "@/lib/database/client";
import { canonicalizeUrl, contentFingerprint, isVisibleArticle } from "./articles";
import { isRefreshLocked, isSourceFresh } from "./freshness";
import { assignKeywordTopics } from "./topics";
import { RssAtomConnector } from "../connectors/rss-atom";
import { serverEnvironment } from "@/lib/environment/server";
import type { Prisma } from "@/generated/prisma/client";

const connector = new RssAtomConnector();
type Source = Awaited<ReturnType<typeof loadSources>>[number];

async function loadSources(topicSlugs:string[]) {
  return database.feedSource.findMany({where:{status:"ACTIVE",topics:{some:{topic:{slug:{in:topicSlugs},status:"ACTIVE"}}}},include:{topics:{include:{topic:true}}}});
}

async function acquire(source: Source, now:Date) {
  const expiry = new Date(now.getTime()-serverEnvironment.REFRESH_LOCK_TIMEOUT_MINUTES*60_000);
  const result = await database.feedSource.updateMany({where:{id:source.id,OR:[{refreshLockAt:null},{refreshLockAt:{lt:expiry}}]},data:{refreshLockAt:now,lastRefreshAttemptedAt:now}});
  return result.count === 1;
}

export async function refreshRelevantSources(topicSlugs:string[], projectRefreshMinutes:number, projectId?:string, force=false) {
  const now=new Date(); const sources=await loadSources(topicSlugs);
  const stale=sources.filter(s=>force||!isSourceFresh(s.lastSuccessfulRefreshAt,s.minimumRefreshIntervalMinutes,projectRefreshMinutes,now));
  const run=await database.processingRun.create({data:{triggerType:force?"MANUAL":"ON_DEMAND",projectId,status:"RUNNING",sourcesRequested:stale.length}});
  let refreshed=0; let inProgress=0; let added=0; let duplicates=0; let discovered=0;
  for(const source of stale){
    if(isRefreshLocked(source.refreshLockAt,now,serverEnvironment.REFRESH_LOCK_TIMEOUT_MINUTES)||!(await acquire(source,now))){inProgress++;continue}
    const started=Date.now();
    try{
      const items=await connector.collect({feedUrl:source.feedUrl,feedType:source.feedType.toLowerCase() as "rss"|"atom"|"auto",name:source.name}); discovered+=items.length;
      let sourceAdded=0,sourceDuplicates=0;
      for(const item of items){
        if(!isVisibleArticle(item.publishedAt,now,now,serverEnvironment.NEWS_VISIBLE_HOURS)) continue;
        const url=canonicalizeUrl(item.canonicalUrl); const fingerprint=contentFingerprint({canonicalUrl:url,title:item.title,source:source.name,publishedAt:item.publishedAt});
        const exists=await database.externalArticle.findFirst({where:{OR:[{canonicalUrl:url},{contentFingerprint:fingerprint},...(item.externalId?[{feedSourceId:source.id,externalIdentifier:item.externalId}]:[])]}});
        if(exists){duplicates++;sourceDuplicates++;continue}
        const keyword=assignKeywordTopics(item.title,item.description);
        const mappings=[...source.topics.map(m=>({topicId:m.topicId,score:m.weight,assignmentSource:"FEED_MAPPING" as const})),
          ...keyword.flatMap(k=>{const match=source.topics.find(m=>m.topic.slug===k.slug);return match?[{topicId:match.topicId,score:k.score,assignmentSource:"KEYWORD_RULE" as const}]:[]})];
        await database.externalArticle.create({data:{feedSourceId:source.id,externalIdentifier:item.externalId,canonicalUrl:url,title:item.title,description:item.description,author:item.author,imageUrl:item.imageUrl,publishedAt:item.publishedAt,contentFingerprint:fingerprint,sourceMetadata:item.sourceMetadata as Prisma.InputJsonValue,topics:{create:mappings}}});
        added++;sourceAdded++;
      }
      refreshed++;
      await database.feedSource.update({where:{id:source.id},data:{lastSuccessfulRefreshAt:new Date(),refreshLockAt:null,consecutiveFailureCount:0}});
      await database.processingRunSource.create({data:{processingRunId:run.id,feedSourceId:source.id,status:"SUCCEEDED",itemsReceived:items.length,itemsAdded:sourceAdded,duplicatesSkipped:sourceDuplicates,durationMs:Date.now()-started}});
    }catch(error){
      await database.feedSource.update({where:{id:source.id},data:{refreshLockAt:null,consecutiveFailureCount:{increment:1}}});
      await database.processingRunSource.create({data:{processingRunId:run.id,feedSourceId:source.id,status:"FAILED",durationMs:Date.now()-started,errorMessage:error instanceof Error?error.message.slice(0,300):"Unknown feed error"}});
    }
  }
  const cutoff=new Date(now.getTime()-serverEnvironment.NEWS_VISIBLE_HOURS*3_600_000);
  const expired=(await database.externalArticle.updateMany({where:{status:"ACTIVE",publishedAt:{lt:cutoff}},data:{status:"EXPIRED"}})).count;
  await database.processingRun.update({where:{id:run.id},data:{status:refreshed===stale.length?"SUCCEEDED":refreshed?"PARTIAL":"SKIPPED",completedAt:new Date(),sourcesProcessed:refreshed,articlesDiscovered:discovered,articlesAdded:added,duplicatesSkipped:duplicates,articlesExpired:expired}});
  return {status:stale.length===0?"fresh":refreshed?"refreshed":inProgress?"refresh_in_progress":"unavailable",sourcesConsidered:sources.length,sourcesRefreshed:refreshed};
}
