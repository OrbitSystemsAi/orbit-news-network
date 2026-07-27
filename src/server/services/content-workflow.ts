export const CONTENT_TRANSITIONS:Record<string,string[]>={DRAFT:["SUBMITTED"],SUBMITTED:["UNDER_REVIEW","APPROVED"],UNDER_REVIEW:["APPROVED","REJECTED"],APPROVED:["PUBLISHED"],REJECTED:[],PUBLISHED:["PAUSED","ARCHIVED"],PAUSED:["PUBLISHED","ARCHIVED"],ARCHIVED:[]};
export function canTransition(from:string,to:string){return CONTENT_TRANSITIONS[from]?.includes(to)??false}
export function assertTransition(from:string,to:string){if(!canTransition(from,to))throw new Error("INVALID_STATUS_TRANSITION")}
