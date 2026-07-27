export function ownsPublication(projectId:string,publicationProjectId:string){return projectId===publicationProjectId}
export function contributorScopeKey(projectId:string,externalContributorId:string){return `${projectId}:${externalContributorId}`}
export function hasScope(scopes:string[],required:string){return scopes.includes(required)}
export function isActiveContent(status:string){return status==="PUBLISHED"}
export function aggregateInteractionCounts(values:string[]){const counts:Record<string,number>={};for(const value of values)counts[value]=(counts[value]??0)+1;const shown=counts.SHOWN??0;return{counts,openRate:shown?(counts.OPENED??0)/shown:0,saveRate:shown?(counts.SAVED??0)/shown:0,dismissalRate:shown?(counts.DISMISSED??0)/shown:0}}
export function unifiedFeedResponse(firstPartyItems:unknown[],newsItems:unknown[]){return{generatedAt:new Date(0).toISOString(),firstPartyItems,newsItems,recommendations:{suggestedNewsInterval:5,suggestedMaximumNewsRatio:0.2}}}
