import type { RequestedTopic } from "./relevance";
export type ContentCandidate={id:string;publishedAt:Date;topics:Array<{slug:string;weight:number}>};
export function rankContent(items:ContentCandidate[],requested:RequestedTopic[],opts:{excludedTopics:string[];excludedIds:string[];maximumItems:number;now?:Date}){
 const excluded=new Set(opts.excludedTopics),ids=new Set(opts.excludedIds),map=new Map(requested.map(x=>[x.slug,x]));
 return items.filter(x=>!ids.has(x.id)&&!x.topics.some(t=>excluded.has(t.slug))&&x.topics.some(t=>map.has(t.slug))).map(item=>{
  let score=0;
  for(const topic of item.topics){const req=map.get(topic.slug);if(req)score+=req.weight*topic.weight*(req.source==="career"?1.25:req.source==="network"?0.7:1)}
  const age=Math.max(0,((opts.now??new Date()).getTime()-item.publishedAt.getTime())/3_600_000);score+=Math.max(0,2-age/168*2);
  return{item,relevanceScore:Math.round(score*100)/100};
 }).filter(x=>x.relevanceScore>=2).sort((a,b)=>b.relevanceScore-a.relevanceScore).slice(0,opts.maximumItems);
}
