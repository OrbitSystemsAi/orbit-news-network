export const CONTENT_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["PUBLISHED"],
  REJECTED: [],
  PUBLISHED: ["PAUSED", "ARCHIVED"],
  PAUSED: ["PUBLISHED", "ARCHIVED"],
  ARCHIVED: [],
};

export const moderationReasonCodes = [
  "policy_compliant",
  "needs_legal_review",
  "needs_editorial_review",
  "citation_issue",
  "attribution_issue",
  "distribution_issue",
  "unsafe_or_prohibited_content",
  "insufficient_information",
] as const;

export function canTransition(from: string, to: string) {
  return CONTENT_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: string, to: string) {
  if (!canTransition(from, to)) throw new Error("INVALID_STATUS_TRANSITION");
}

export function reviewPriority(submittedAt: Date, now = new Date()) {
  const ageHours = Math.max(0, (now.getTime() - submittedAt.getTime()) / 3_600_000);
  return ageHours >= 48 ? "overdue" : ageHours >= 24 ? "due_soon" : "normal";
}
