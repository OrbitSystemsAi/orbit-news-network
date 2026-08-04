"use client";

import { useCallback, useEffect, useState } from "react";
import { Panel } from "./ui";

type Item = {
  id: string;
  title: string;
  summary?: string | null;
  body: string;
  status: string;
  contentType: string;
  distributionLevel: string;
  submittedAt: string;
  reviewPriority?: "normal" | "due_soon" | "overdue";
  project: { name: string };
  publication: { name: string };
  contributor?: { displayName?: string | null } | null;
  topics: Array<{ topic: { name: string } }>;
  citations: Array<{ label: string; url: string }>;
  moderationDecisions: Array<{ id: string; decision: string; reasonCode: string; notes?: string | null; decidedAt: string }>;
};

const reasons = [
  ["policy_compliant", "Policy compliant"],
  ["needs_legal_review", "Needs legal review"],
  ["needs_editorial_review", "Needs editorial review"],
  ["citation_issue", "Citation issue"],
  ["attribution_issue", "Attribution issue"],
  ["distribution_issue", "Distribution issue"],
  ["unsafe_or_prohibited_content", "Unsafe or prohibited content"],
  ["insufficient_information", "Insufficient information"],
] as const;

export function ContentAdmin({ moderation = false }: { moderation?: boolean }) {
  const [items, setItems] = useState<Item[]>([]);
  const [message, setMessage] = useState("Loading content…");
  const [reasonCode, setReasonCode] = useState("policy_compliant");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState<string>();

  const load = useCallback(async () => {
    const query = moderation ? "?status=SUBMITTED,UNDER_REVIEW" : "";
    const response = await fetch(`/api/internal/content${query}`, { cache: "no-store" });
    const result = await response.json();
    if (response.ok) {
      setItems(result.data);
      setMessage(result.data.length ? `${result.data.length} item${result.data.length === 1 ? "" : "s"} loaded.` : "The queue is clear.");
    } else setMessage(result.error?.message ?? "Content could not be loaded.");
  }, [moderation]);

  useEffect(() => {
    let active = true;
    const query = moderation ? "?status=SUBMITTED,UNDER_REVIEW" : "";
    fetch(`/api/internal/content${query}`, { cache: "no-store" })
      .then(async response => ({ response, result: await response.json() }))
      .then(({ response, result }) => {
        if (!active) return;
        if (response.ok) {
          setItems(result.data);
          setMessage(result.data.length ? `${result.data.length} item${result.data.length === 1 ? "" : "s"} loaded.` : "The queue is clear.");
        } else setMessage(result.error?.message ?? "Content could not be loaded.");
      })
      .catch(() => { if (active) setMessage("Content could not be loaded."); });
    return () => { active = false; };
  }, [moderation]);

  async function decide(id: string, status?: string, action: "transition" | "escalate" = "transition") {
    setPending(id);
    const response = await fetch("/api/internal/content", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status, action, reasonCode, notes: notes.trim() || undefined }),
    });
    const result = await response.json();
    setMessage(response.ok ? action === "escalate" ? "Escalation recorded; the item remains under review." : `Content moved to ${status?.toLowerCase().replaceAll("_", " ")}.` : result.error?.message ?? "The decision could not be recorded.");
    setPending(undefined);
    if (response.ok) { setNotes(""); await load(); }
  }

  return <div className="page-grid">
    <Panel title={moderation ? "Review controls" : "Content controls"}>
      <div style={{ padding: 15, display: "grid", gap: 10, gridTemplateColumns: "minmax(160px, .6fr) minmax(220px, 1.4fr) auto" }}>
        <select aria-label="Decision reason" value={reasonCode} onChange={event => setReasonCode(event.target.value)} style={field}>
          {reasons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <input aria-label="Decision notes" value={notes} onChange={event => setNotes(event.target.value)} placeholder="Required for rejection or escalation" maxLength={2000} style={field} />
        <button onClick={() => void load()} style={button}>Refresh queue</button>
      </div>
      <p className="muted" role="status" style={{ padding: "0 15px 12px", fontSize: 10 }}>{message}</p>
    </Panel>
    <Panel title={moderation ? "Triage and moderation queue" : "Content submissions"}>
      <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
        <thead><tr>{["Content", "Origin", "Status", "Evidence", "Actions"].map(label => <th key={label} style={th}>{label}</th>)}</tr></thead>
        <tbody>{items.map(item => <tr key={item.id}>
          <td style={td}><strong>{item.title}</strong><div className="muted" style={{ maxWidth: 380, marginTop: 4 }}>{item.summary || item.body.slice(0, 180)}</div><div className="muted" style={{ marginTop: 5 }}>{item.contributor?.displayName ?? "No contributor"} · {item.topics.map(topic => topic.topic.name).join(", ")}</div></td>
          <td style={td}>{item.project.name}<div className="muted">{item.publication.name}</div><div className="muted">{item.contentType} · {item.distributionLevel}</div></td>
          <td style={td}><strong>{item.status.replaceAll("_", " ")}</strong><div className={item.reviewPriority === "overdue" ? "danger-text" : "muted"}>{item.reviewPriority?.replaceAll("_", " ")}</div><div className="muted">{new Date(item.submittedAt).toLocaleString()}</div></td>
          <td style={td}>{item.citations.length ? item.citations.map(citation => <div key={citation.url}><a href={citation.url} target="_blank" rel="noreferrer">{citation.label}</a></div>) : <span className="muted">No citations</span>}<div className="muted" style={{ marginTop: 5 }}>{item.moderationDecisions.length} decision record{item.moderationDecisions.length === 1 ? "" : "s"}</div></td>
          <td style={td}><div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {item.status === "SUBMITTED" && <button disabled={pending === item.id} onClick={() => void decide(item.id, "UNDER_REVIEW")} style={button}>Begin review</button>}
            {item.status === "UNDER_REVIEW" && <><button disabled={pending === item.id} onClick={() => void decide(item.id, "APPROVED")} style={button}>Approve</button><button disabled={pending === item.id || !notes.trim()} onClick={() => void decide(item.id, "REJECTED")} style={dangerButton}>Reject</button><button disabled={pending === item.id || !notes.trim()} onClick={() => void decide(item.id, undefined, "escalate")} style={secondaryButton}>Escalate</button></>}
            {!moderation && item.status === "APPROVED" && <button disabled={pending === item.id} onClick={() => void decide(item.id, "PUBLISHED")} style={button}>Publish</button>}
            {!moderation && item.status === "PUBLISHED" && <><button disabled={pending === item.id} onClick={() => void decide(item.id, "PAUSED")} style={secondaryButton}>Pause</button><button disabled={pending === item.id} onClick={() => void decide(item.id, "ARCHIVED")} style={secondaryButton}>Archive</button></>}
            {!moderation && item.status === "PAUSED" && <><button disabled={pending === item.id} onClick={() => void decide(item.id, "PUBLISHED")} style={button}>Republish</button><button disabled={pending === item.id} onClick={() => void decide(item.id, "ARCHIVED")} style={secondaryButton}>Archive</button></>}
          </div></td>
        </tr>)}</tbody>
      </table></div>
    </Panel>
  </div>;
}

const field = { background: "#07131f", border: "1px solid #256399", borderRadius: 5, color: "#e8f5ff", padding: "9px 10px", fontSize: 10 };
const button = { background: "#123d68", border: "1px solid #256399", borderRadius: 5, color: "#e8f5ff", padding: "8px 10px", fontSize: 9 };
const secondaryButton = { ...button, background: "transparent" };
const dangerButton = { ...button, background: "#6f1d2b", borderColor: "#a33b4d" };
const th = { padding: 12, textAlign: "left" as const, color: "#90a4b8", borderBottom: "1px solid #23384f" };
const td = { padding: 12, borderBottom: "1px solid rgba(35,56,79,.55)", verticalAlign: "top" as const };
