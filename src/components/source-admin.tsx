"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Panel } from "./ui";

type Topic = { id: string; name: string; slug: string };
type Source = {
  id: string;
  name: string;
  feedUrl: string;
  status: string;
  feedType: string;
  minimumRefreshIntervalMinutes: number;
  lastSuccessfulRefreshAt: string | null;
  consecutiveFailureCount: number;
  officialFeedConfirmed: boolean;
  termsReviewed: boolean;
  attributionNotes: string | null;
  reviewedAt: string | null;
  policyReviewDueAt: string | null;
  topics: Array<{ topic: Topic }>;
};
type TestResult = { itemCount: number; sampleTitles: string[]; format: string };
type RecentArticle = { id: string; title: string; canonicalUrl: string; publishedAt: string; collectedAt: string; feedSource: { name: string }; topics: Array<{ topic: { name: string } }> };
type ProcessingRun = { id: string; status: string; triggerType: string; startedAt: string; completedAt: string | null; sourcesProcessed: number; articlesDiscovered: number; articlesAdded: number; duplicatesSkipped: number; articlesExpired: number };

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function SourceAdmin() {
  const [sources, setSources] = useState<Source[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [recentArticles, setRecentArticles] = useState<RecentArticle[]>([]);
  const [recentRuns, setRecentRuns] = useState<ProcessingRun[]>([]);
  const [name, setName] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testedUrl, setTestedUrl] = useState("");
  const [message, setMessage] = useState("Loading source inventory…");
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/internal/sources");
    const json = await response.json();
    if (!response.ok) {
      setMessage(json.error?.message ?? "Unable to load sources.");
      return;
    }
    setSources(json.data.sources);
    setTopics(json.data.availableTopics);
    setRecentArticles(json.data.recentArticles);
    setRecentRuns(json.data.recentRuns);
    setMessage(json.data.sources.length ? `${json.data.sources.length} source${json.data.sources.length === 1 ? "" : "s"} loaded.` : "No external sources have been added yet.");
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/internal/sources")
      .then(async (response) => ({ response, json: await response.json() }))
      .then(({ response, json }) => {
        if (!active) return;
        if (!response.ok) {
          setMessage(json.error?.message ?? "Unable to load sources.");
          return;
        }
        setSources(json.data.sources);
        setTopics(json.data.availableTopics);
        setRecentArticles(json.data.recentArticles);
        setRecentRuns(json.data.recentRuns);
        setMessage(json.data.sources.length ? `${json.data.sources.length} source${json.data.sources.length === 1 ? "" : "s"} loaded.` : "No external sources have been added yet.");
      })
      .catch(() => { if (active) setMessage("Unable to load sources."); });
    return () => { active = false; };
  }, []);

  const payload = useMemo(() => ({
    name: name.trim(),
    slug: slugify(name),
    feedUrl: feedUrl.trim(),
    feedType: "auto",
    minimumRefreshIntervalMinutes: 30,
    topicSlugs: selectedTopics,
  }), [feedUrl, name, selectedTopics]);

  async function testSource() {
    setPendingAction("test");
    setTestResult(null);
    const response = await fetch("/api/internal/sources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, action: "test" }),
    });
    const json = await response.json();
    setPendingAction(null);
    if (!response.ok) {
      setMessage(json.error?.message ?? "The feed test failed.");
      return;
    }
    setTestResult(json.data);
    setTestedUrl(feedUrl.trim());
    setMessage(`Feed test passed. ${json.data.itemCount} parseable items found; nothing was stored.`);
  }

  async function addSource() {
    setPendingAction("add");
    const response = await fetch("/api/internal/sources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await response.json();
    setPendingAction(null);
    if (!response.ok) {
      setMessage(json.error?.message ?? "The source could not be added.");
      return;
    }
    setName("");
    setFeedUrl("");
    setSelectedTopics([]);
    setTestResult(null);
    setTestedUrl("");
    setMessage("Source added as pending review. It will not ingest news until activated.");
    await load();
  }

  async function setStatus(id: string, status: string) {
    const source = sources.find((candidate) => candidate.id === id);
    let review = {};
    if (status === "ACTIVE" && source && (!source.officialFeedConfirmed || !source.termsReviewed || !source.attributionNotes)) {
      const officialFeedConfirmed = window.confirm("Confirm this feed is published or authorized by the named source.");
      if (!officialFeedConfirmed) return;
      const termsReviewed = window.confirm("Confirm the publisher terms and redistribution restrictions were reviewed.");
      if (!termsReviewed) return;
      const attributionNotes = window.prompt("Record the required attribution (for example: Link to the original NASA release).", source.attributionNotes ?? "");
      if (!attributionNotes?.trim()) { setMessage("Attribution requirements are required before activation."); return; }
      const editorialNotes = window.prompt("Optional editorial-quality or restriction notes.", "") ?? undefined;
      review = { officialFeedConfirmed, termsReviewed, attributionNotes, editorialNotes };
    }
    setPendingAction(id);
    const response = await fetch("/api/internal/sources", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status, ...review }),
    });
    const json = await response.json();
    setPendingAction(null);
    setMessage(response.ok ? `Source moved to ${status.toLowerCase().replace("_", " ")}.` : json.error?.message ?? "The source could not be updated.");
    if (response.ok) await load();
  }

  async function refreshActiveSources() {
    setPendingAction("refresh");
    const response = await fetch("/api/internal/news/refresh", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = await response.json();
    setPendingAction(null);
    if (!response.ok) {
      setMessage(json.error?.message ?? "Refresh failed.");
      return;
    }
    setMessage(`Refresh ${json.data.status}: ${json.data.sourcesRefreshed} source${json.data.sourcesRefreshed === 1 ? "" : "s"} refreshed.`);
    await load();
  }

  const canTest = name.trim().length >= 2 && feedUrl.trim().length > 0 && !pendingAction;
  const canAdd = canTest && selectedTopics.length > 0 && testedUrl === feedUrl.trim() && Boolean(testResult);

  return <div className="page-grid source-admin">
    <Panel title="Onboard an external source">
      <div className="source-form">
        <div className="source-form-grid">
          <label>Source name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Publisher or feed name" /></label>
          <label>RSS or Atom URL<input type="url" value={feedUrl} onChange={(event) => { setFeedUrl(event.target.value); setTestResult(null); }} placeholder="https://publisher.example/feed.xml" /></label>
        </div>
        <fieldset>
          <legend>Topic mappings <span>Choose at least one</span></legend>
          <div className="topic-options">{topics.map((topic) => <label key={topic.id}>
            <input type="checkbox" checked={selectedTopics.includes(topic.slug)} onChange={(event) => setSelectedTopics((current) => event.target.checked ? [...current, topic.slug] : current.filter((slug) => slug !== topic.slug))} />
            {topic.name}
          </label>)}</div>
        </fieldset>
        <div className="source-actions">
          <button type="button" className="secondary-button" disabled={!canTest} onClick={testSource}>{pendingAction === "test" ? "Testing…" : "Test feed"}</button>
          <button type="button" disabled={!canAdd} onClick={addSource}>{pendingAction === "add" ? "Adding…" : "Add for review"}</button>
          <span>Testing fetches metadata but stores nothing. New sources remain inactive.</span>
        </div>
        {testResult ? <div className="feed-test-result">
          <strong>{testResult.format.toUpperCase()} feed · {testResult.itemCount} valid items</strong>
          {testResult.sampleTitles.length ? <ol>{testResult.sampleTitles.map((title) => <li key={title}>{title}</li>)}</ol> : <p>The feed is valid but currently empty.</p>}
        </div> : null}
        <p className="source-status" role="status" aria-live="polite">{message}</p>
      </div>
    </Panel>

    <Panel title="Source inventory">
      <div className="inventory-toolbar">
        <p>Only active sources participate in ingestion.</p>
        <button type="button" disabled={Boolean(pendingAction) || !sources.some((source) => source.status === "ACTIVE")} onClick={refreshActiveSources}>{pendingAction === "refresh" ? "Refreshing…" : "Refresh active sources"}</button>
      </div>
      {sources.length ? <div className="source-table-wrap"><table className="source-table">
        <thead><tr><th>Source</th><th>Topics</th><th>Status</th><th>Policy review</th><th>Last success</th><th>Failures</th><th>Actions</th></tr></thead>
        <tbody>{sources.map((source) => <tr key={source.id}>
          <td><strong>{source.name}</strong><a href={source.feedUrl} target="_blank" rel="noreferrer">{source.feedUrl}</a></td>
          <td>{source.topics.map(({ topic }) => topic.name).join(", ")}</td>
          <td><span className={`source-badge source-badge-${source.status.toLowerCase()}`}>{source.status.replace("_", " ")}</span></td>
          <td>{source.reviewedAt ? <><span>Reviewed {new Date(source.reviewedAt).toLocaleDateString()}</span><small>{source.policyReviewDueAt ? `Due ${new Date(source.policyReviewDueAt).toLocaleDateString()}` : ""}</small></> : "Not recorded"}</td>
          <td>{source.lastSuccessfulRefreshAt ? new Date(source.lastSuccessfulRefreshAt).toLocaleString() : "Never"}</td>
          <td>{source.consecutiveFailureCount}</td>
          <td><div className="row-actions">
            {source.status !== "ACTIVE" ? <button type="button" disabled={pendingAction === source.id} onClick={() => setStatus(source.id, "ACTIVE")}>Activate</button> : <button type="button" className="secondary-button" disabled={pendingAction === source.id} onClick={() => setStatus(source.id, "PAUSED")}>Pause</button>}
            {source.status !== "REJECTED" ? <button type="button" className="danger-button" disabled={pendingAction === source.id} onClick={() => setStatus(source.id, "REJECTED")}>Reject</button> : <button type="button" className="secondary-button" disabled={pendingAction === source.id} onClick={() => setStatus(source.id, "PENDING_REVIEW")}>Reopen</button>}
          </div></td>
        </tr>)}</tbody>
      </table></div> : <div className="source-empty">No sources yet. Test a feed above to begin the review process.</div>}
    </Panel>

    <div className="source-operations-grid">
      <Panel title="Recent external news">
        {recentArticles.length ? <div className="external-news-list">{recentArticles.map((article) => <article key={article.id}>
          <div><span>{article.feedSource.name}</span><time dateTime={article.publishedAt}>{new Date(article.publishedAt).toLocaleString()}</time></div>
          <a href={article.canonicalUrl} target="_blank" rel="noreferrer">{article.title}</a>
          <p>{[...new Set(article.topics.map(({ topic }) => topic.name))].join(" · ")}</p>
        </article>)}</div> : <div className="source-empty">No fresh external articles are stored.</div>}
      </Panel>
      <Panel title="Recent ingestion runs">
        {recentRuns.length ? <div className="processing-run-list">{recentRuns.map((run) => <div key={run.id}>
          <div><span className={`source-badge source-badge-${run.status.toLowerCase()}`}>{run.status}</span><time dateTime={run.startedAt}>{new Date(run.startedAt).toLocaleString()}</time></div>
          <p>{run.sourcesProcessed} sources · {run.articlesDiscovered} discovered · {run.articlesAdded} added · {run.duplicatesSkipped} duplicates · {run.articlesExpired} expired</p>
        </div>)}</div> : <div className="source-empty">No ingestion runs recorded.</div>}
      </Panel>
    </div>
  </div>;
}
