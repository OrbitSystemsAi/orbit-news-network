export type TopicRule = { slug: string; keywords: string[] };

export const TOPIC_RULES: TopicRule[] = [
  { slug: "healthcare", keywords: ["healthcare", "health system", "hospital", "patient care"] },
  { slug: "medicine", keywords: ["medical research", "clinical trial", "physician", "medicine"] },
  { slug: "real-estate", keywords: ["real estate", "housing market", "mortgage"] },
  { slug: "finance", keywords: ["financial markets", "banking", "interest rates", "investment"] },
  { slug: "artificial-intelligence", keywords: ["artificial intelligence", "machine learning", "generative ai"] },
  { slug: "technology", keywords: ["software", "cybersecurity", "cloud computing", "technology"] },
  { slug: "careers", keywords: ["career development", "career change", "professional development"] },
  { slug: "employment", keywords: ["employment", "labor market", "hiring", "job openings"] },
  { slug: "remote-work", keywords: ["remote work", "hybrid work", "work from home"] },
  { slug: "digital-transformation", keywords: ["digital transformation", "business modernization"] },
  { slug: "data-analytics", keywords: ["data analytics", "business intelligence"] },
  { slug: "business", keywords: ["small business", "business strategy", "entrepreneurship"] },
  { slug: "marketing", keywords: ["digital marketing", "brand strategy", "advertising"] },
  { slug: "government", keywords: ["government policy", "public sector", "federal agency"] },
  { slug: "education", keywords: ["higher education", "education policy", "college"] },
];

export function authorizeTopics(requested: string[], enabled: string[]) {
  const allowed = new Set(enabled);
  const unauthorized = [...new Set(requested)].filter(slug => !allowed.has(slug));
  return { authorized: requested.filter(slug => allowed.has(slug)), unauthorized };
}

export function assignKeywordTopics(title: string, description = "", rules = TOPIC_RULES) {
  const haystack = `${title} ${description}`.toLowerCase();
  return rules.filter(rule => rule.keywords.some(keyword => haystack.includes(keyword))).map(rule => ({
    slug: rule.slug,
    score: title.toLowerCase().includes(rule.keywords.find(k => title.toLowerCase().includes(k)) ?? "\u0000") ? 1 : 0.7,
    assignmentSource: "keyword_rule" as const,
  }));
}
