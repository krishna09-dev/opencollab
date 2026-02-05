// apps/web/src/features/prTracking/types.ts

export type PrStatus = "ACCEPTED" | "PR_OPEN" | "MERGED" | "CLOSED";
export type PrStatusFilter = "All" | PrStatus;
export type PrDisplayStatus = "OPEN" | "IN_REVIEW" | "CHANGES_REQUESTED" | "MERGED";

export type PrFilterState = {
  q: string;
  status: PrStatusFilter | PrDisplayStatus;
  repo: "All" | string;
};

export type PrTrackingItem = {
  id: string;
  title: string;

  repoFullName: string; // "org/repo"
  issueNumber: number;
  prNumber?: number | null;
  prTitle?: string | null;
  prBody?: string | null;
  prUrl?: string | null;
  prUpdatedAt?: string | null;
  primaryLanguage?: string | null;
  commentsCount?: number;
  reviewCommentsCount?: number;

  status: PrStatus;
  displayStatus?: PrDisplayStatus;

  updatedAtLabel?: string;
  shortSummary?: string;

  messagesCount?: number;
  lastMessagePreview?: string;

  lastSyncAt?: string | null;
};

export type PrSummary = {
  total: number;
  open: number;
  inReview?: number;
  changesRequested?: number;
  merged: number;
  accepted?: number;
  closed?: number;
};

export type PrListResponse = {
  items: PrTrackingItem[];
  total: number;
  summary: PrSummary;
};

export type PrMessageKind = "comment" | "system";

export type PrMessage = {
  id: string;
  author: string; // "you" | "maintainer" | "system" (for now)
  createdAtLabel: string; // "2m ago", "1d ago"
  text: string;
  kind?: PrMessageKind;
};
