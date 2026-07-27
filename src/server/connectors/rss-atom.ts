import { XMLParser } from "fast-xml-parser";
import { collectedArticleSchema, type CollectedArticle, type FeedSourceConfiguration, type NewsSourceConnector } from "./news-source";

const array = <T>(value: T | T[] | undefined): T[] => value === undefined ? [] : Array.isArray(value) ? value : [value];
const text = (value: unknown): string => {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return text(record["#text"] ?? record.__cdata ?? "");
  }
  return "";
};
const date = (value: unknown, fallback: Date) => {
  const parsed = new Date(text(value));
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
};
const link = (value: unknown) => {
  if (Array.isArray(value)) {
    const alternate = value.find(v => typeof v === "object" && v && (v as Record<string,unknown>)["@_rel"] !== "self");
    return link(alternate ?? value[0]);
  }
  if (typeof value === "object" && value) return text((value as Record<string,unknown>)["@_href"] ?? (value as Record<string,unknown>).href);
  return text(value);
};

export function normalizeFeedXml(xml: string, collectedAt = new Date()): CollectedArticle[] {
  const parser = new XMLParser({ ignoreAttributes:false, attributeNamePrefix:"@_", cdataPropName:"__cdata" });
  const document = parser.parse(xml) as Record<string, any>;
  const rssItems = array(document?.rss?.channel?.item);
  const atomItems = array(document?.feed?.entry);
  const records = rssItems.length ? rssItems.map((item:any) => ({
    externalId: text(item.guid) || null, title:text(item.title), description:text(item.description ?? item["content:encoded"]),
    canonicalUrl:link(item.link), author:text(item.author ?? item["dc:creator"]) || null,
    imageUrl:link(item.enclosure?.["@_url"] ?? item["media:content"]?.["@_url"]) || null,
    publishedAt:date(item.pubDate ?? item.date, collectedAt), sourceMetadata:{format:"rss"},
  })) : atomItems.map((item:any) => ({
    externalId:text(item.id) || null, title:text(item.title), description:text(item.summary ?? item.content),
    canonicalUrl:link(item.link), author:text(item.author?.name ?? item.author) || null,
    imageUrl:null, publishedAt:date(item.published ?? item.updated, collectedAt), sourceMetadata:{format:"atom"},
  }));
  return records.flatMap(record => {
    const parsed = collectedArticleSchema.safeParse(record);
    return parsed.success ? [parsed.data] : [];
  });
}

export class RssAtomConnector implements NewsSourceConnector {
  async collect(source: FeedSourceConfiguration) {
    const timeout = Number(process.env.FEED_REQUEST_TIMEOUT_MS ?? 10000);
    const response = await fetch(source.feedUrl, {
      signal: AbortSignal.timeout(timeout),
      headers: { "user-agent":"Orbit-News-Network/0.2 (+https://orbit.systems; RSS/Atom metadata only)", accept:"application/rss+xml, application/atom+xml, application/xml, text/xml" },
      redirect:"follow",
    });
    if (!response.ok) throw new Error(`Feed request failed with status ${response.status}.`);
    return normalizeFeedXml(await response.text());
  }
}
