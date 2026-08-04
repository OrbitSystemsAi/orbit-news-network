import { describe,expect,it,vi } from "vitest";
import { generateApiKey,hashApiKey,verifyApiKey } from "@/server/services/api-keys";
import { authenticateBearer } from "@/server/services/authentication";
import { normalizeFeedXml } from "@/server/connectors/rss-atom";
import { canonicalizeUrl,contentFingerprint,isDuplicate,isVisibleArticle } from "@/server/services/articles";
import { assignKeywordTopics,authorizeTopics } from "@/server/services/topics";
import { rankRelevantArticles,scoreArticle } from "@/server/services/relevance";
import { isRefreshLocked,isSourceFresh,requiredRefreshMinutes } from "@/server/services/freshness";
import { feedbackRequestSchema,relevantNewsRequestSchema } from "@/lib/validation/news";
import { isPublicNetworkAddress } from "@/server/connectors/feed-safety";
import { permittedSourceImageUrl } from "@/server/services/source-media";
import { nextSourceFailureState } from "@/server/services/source-health";
import normalization from "./fixtures/normalization-deduplication.json";

const secret="a-secure-test-pepper-that-is-at-least-32-characters";
describe("API keys",()=>{
 it("generates development keys with recognizable prefixes",()=>{const key=generateApiKey();expect(key.key).toMatch(/^onn_dev_/);expect(key.prefix).toHaveLength(16)});
 it("hashes without storing plaintext and verifies",()=>{const {key}=generateApiKey();const hash=hashApiKey(key,secret);expect(hash).not.toContain(key);expect(verifyApiKey(key,hash,secret)).toBe(true);expect(verifyApiKey(key+"x",hash,secret)).toBe(false)});
 it("rejects revoked keys",async()=>{const {key,prefix}=generateApiKey();const repo={findByPrefix:vi.fn().mockResolvedValue({id:"k",keyHash:hashApiKey(key,secret),status:"REVOKED",scopes:["news:read"],project:{id:"p",slug:"p",name:"P",status:"ACTIVE",maximumItemsPerRequest:4,minimumRefreshIntervalMinutes:30}}),markUsed:vi.fn()};expect(await authenticateBearer(`Bearer ${key}`,repo,secret)).toBeNull();expect(prefix).toBe(key.slice(0,16))});
});
describe("RSS and Atom normalization",()=>{
 it("normalizes RSS",()=>{const xml=`<rss><channel><item><guid>1</guid><title>RSS story</title><description>Summary</description><link>https://example.com/a</link><pubDate>Sun, 27 Jul 2026 10:00:00 GMT</pubDate></item></channel></rss>`;expect(normalizeFeedXml(xml)[0]).toMatchObject({externalId:"1",title:"RSS story",canonicalUrl:"https://example.com/a"})});
 it("normalizes Atom",()=>{const xml=`<feed><entry><id>x</id><title>Atom story</title><summary>Summary</summary><link href="https://example.com/b"/><updated>2026-07-27T10:00:00Z</updated><author><name>Editor</name></author></entry></feed>`;expect(normalizeFeedXml(xml)[0]).toMatchObject({externalId:"x",author:"Editor",canonicalUrl:"https://example.com/b"})});
 it("falls back to collection time for missing dates",()=>{const fallback=new Date("2026-07-27T12:00:00Z");const item=normalizeFeedXml(`<rss><channel><item><title>No date</title><link>https://example.com/c</link></item></channel></rss>`,fallback)[0];expect(item.publishedAt).toEqual(fallback)});
 it("rejects non-feed XML",()=>expect(()=>normalizeFeedXml(`<html><body>Not a feed</body></html>`)).toThrow("not an RSS or Atom feed"));
 it("drops malformed entries without rejecting valid neighbors",()=>{const items=normalizeFeedXml(`<rss><channel><item><title>Missing URL</title></item><item><title>Valid</title><link>https://example.com/valid</link></item></channel></rss>`);expect(items.map(item=>item.title)).toEqual(["Valid"])});
});
describe("feed network safety",()=>{
 it.each(["127.0.0.1","10.0.0.8","169.254.169.254","192.0.0.1","192.0.2.1","192.168.1.1","198.51.100.1","203.0.113.1","::1","fd00::1","fe80::1"])("rejects non-public address %s",address=>expect(isPublicNetworkAddress(address)).toBe(false));
 it.each(["8.8.8.8","1.1.1.1","192.0.66.108","2606:4700:4700::1111"])("accepts public address %s",address=>expect(isPublicNetworkAddress(address)).toBe(true));
});
describe("source media permissions",()=>{
 it("blocks feed images by default",()=>expect(permittedSourceImageUrl(false,"https://publisher.example/image.jpg")).toBeNull());
 it("passes images only when explicitly allowed",()=>expect(permittedSourceImageUrl(true,"https://publisher.example/image.jpg")).toBe("https://publisher.example/image.jpg"));
});
describe("source failure controls",()=>{
 it("warns without pausing below the threshold",()=>expect(nextSourceFailureState(1,3)).toEqual({nextFailureCount:2,shouldPause:false,reason:null}));
 it("pauses at the configured threshold",()=>expect(nextSourceFailureState(2,3)).toEqual({nextFailureCount:3,shouldPause:true,reason:"Automatically paused after 3 consecutive refresh failures."}));
});
describe("article identity",()=>{
 it.each(normalization.canonicalization)("canonicalizes $name",({input,expected})=>expect(canonicalizeUrl(input)).toBe(expected));
 it("creates stable fingerprints",()=>{const input={canonicalUrl:"https://e.test/a?utm_medium=x",title:"Hello, World!",source:"Source",publishedAt:new Date("2026-07-27")};expect(contentFingerprint(input)).toBe(contentFingerprint({...input,canonicalUrl:"https://e.test/a"}))});
 it("detects deterministic duplicates",()=>expect(isDuplicate({canonicalUrl:"https://e.test/a?utm_campaign=x",fingerprint:"x"},[{canonicalUrl:"https://e.test/a",fingerprint:"y"}])).toBe(true));
 it.each(normalization.duplicates)("handles duplicate case: $name",testCase=>expect(isDuplicate({canonicalUrl:testCase.candidateUrl,externalId:testCase.candidateExternalId,fingerprint:testCase.sameFingerprint?"same":"candidate"},[{canonicalUrl:testCase.existingUrl,externalId:testCase.existingExternalId,fingerprint:testCase.sameFingerprint?"same":"existing"}])).toBe(testCase.expected));
 it("enforces the 24-hour window and collected fallback",()=>{const now=new Date("2026-07-27T12:00:00Z");expect(isVisibleArticle(new Date("2026-07-26T13:00:00Z"),now,now)).toBe(true);expect(isVisibleArticle(new Date("2026-07-26T11:00:00Z"),now,now)).toBe(false);expect(isVisibleArticle(null,now,now)).toBe(true)});
});
describe("topics and relevance",()=>{
 it("rejects unauthorized topics",()=>expect(authorizeTopics(["healthcare","finance"],["healthcare"]).unauthorized).toEqual(["finance"]));
 it("assigns conservative keyword topics",()=>expect(assignKeywordTopics("Hospital expands patient care","").map(x=>x.slug)).toContain("healthcare"));
 const now=new Date("2026-07-27T12:00:00Z");const articles=[{id:"a",publishedAt:new Date("2026-07-27T11:00:00Z"),topics:[{slug:"healthcare",score:1,assignmentSource:"FEED_MAPPING"}]},{id:"b",publishedAt:new Date("2026-07-27T10:00:00Z"),topics:[{slug:"finance",score:1}]}];
 it("scores explicit career matches strongly",()=>expect(scoreArticle(articles[0],[{slug:"healthcare",weight:10,source:"career"}],now)).toBeGreaterThan(10));
 it("does not inflate relevance when a topic has multiple assignment records",()=>{const article={...articles[0],topics:[...articles[0].topics,{slug:"healthcare",score:.7,assignmentSource:"KEYWORD_RULE"}]};expect(scoreArticle(article,[{slug:"healthcare",weight:10}],now)).toBe(scoreArticle(articles[0],[{slug:"healthcare",weight:10}],now))});
 it("honors excluded topics",()=>expect(rankRelevantArticles(articles,[{slug:"healthcare",weight:10},{slug:"finance",weight:10}],{excludedTopics:["finance"],maximumItems:4,now}).map(x=>x.article.id)).toEqual(["a"]));
 it("excludes previously shown article IDs",()=>expect(rankRelevantArticles(articles,[{slug:"healthcare",weight:10}],{excludeArticleIds:["a"],maximumItems:4,now})).toHaveLength(0));
 it("enforces project maximum items",()=>expect(rankRelevantArticles([...articles,{...articles[0],id:"c"}],[{slug:"healthcare",weight:10}],{maximumItems:1,now})).toHaveLength(1));
});
describe("freshness and validation",()=>{
 const now=new Date("2026-07-27T12:00:00Z");
 it("uses the more restrictive refresh interval",()=>expect(requiredRefreshMinutes(15,30)).toBe(30));
 it("determines freshness",()=>{expect(isSourceFresh(new Date("2026-07-27T11:40:00Z"),15,30,now)).toBe(true);expect(isSourceFresh(new Date("2026-07-27T11:20:00Z"),15,30,now)).toBe(false)});
 it("expires refresh locks",()=>{expect(isRefreshLocked(new Date("2026-07-27T11:58:00Z"),now,5)).toBe(true);expect(isRefreshLocked(new Date("2026-07-27T11:50:00Z"),now,5)).toBe(false)});
 it("validates news requests",()=>expect(relevantNewsRequestSchema.safeParse({externalUserId:"u",topics:[{slug:"healthcare",weight:10}],maximumItems:4}).success).toBe(true));
 it("validates feedback",()=>{expect(feedbackRequestSchema.safeParse({externalUserId:"u",articleId:"a",interaction:"opened"}).success).toBe(true);expect(feedbackRequestSchema.safeParse({externalUserId:"u",articleId:"a",interaction:"clicked"}).success).toBe(false)});
});
