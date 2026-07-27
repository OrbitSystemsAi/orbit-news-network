import { createHash } from "node:crypto";
const UNSAFE=/<\s*(script|iframe|object|embed|style)|on\w+\s*=|javascript\s*:/i;
export function containsUnsafeMarkup(value:string){return UNSAFE.test(value)}
export function contentFingerprint(input:{title:string;body:string;publicationSlug:string}){return createHash("sha256").update([input.publicationSlug,input.title.trim().toLowerCase(),input.body.replace(/\s+/g," ").trim()].join("|")).digest("hex")}
export function requestFingerprint(value:unknown){return createHash("sha256").update(JSON.stringify(value)).digest("hex")}
export function contentSlug(title:string){return title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"").slice(0,120)||"content"}
