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

export type PrTimelineEntry =
  | {
      id: string;
      type: "opened";
      actor: string;
      text: string;
      atLabel: string;
    }
  | {
      id: string;
      type: "commits";
      commits: Array<{ sha: string; message: string; atLabel: string }>;
    }
  | {
      id: string;
      type: "reviewRequested";
      actor: string;
      reviewers: string[];
    }
  | {
      id: string;
      type: "changesRequested";
      actor: string;
      atLabel: string;
      summary: string;
      diffOld: string;
      diffNew: string;
    }
  | {
      id: string;
      type: "maintainerFeedback";
      title: string;
      body: string;
    }
  | {
      id: string;
      type: "restriction";
      body: string;
    };

export type PrDetailResponse = {
  id: string;
  title: string;
  number: number;
  owner: string;
  repo: string;
  status: "OPEN" | "IN_REVIEW" | "CHANGES_REQUESTED" | "MERGED";
  sourceBranch: string;
  targetBranch: string;
  tags: string[];
  overview: {
    author: string;
    commentedAtLabel: string;
    intro: string;
    changes: string[];
    note?: string;
    linkedIssue: {
      number: number;
      title: string;
      openedBy: string;
    };
  };
  timeline: PrTimelineEntry[];
  sidebar: {
    reviewers: Array<{ id: string; name: string; status: "approved" | "changes_requested" | "pending" }>;
    checks: Array<{ id: string; name: string; status: "success" | "running" | "failed"; durationLabel: string; progress: number }>;
    filesChangedTotal: number;
    filesChanged: Array<{ path: string; additions: number; deletions: number }>;
    linkedIssue: {
      number: number;
      title: string;
      openedBy: string;
    };
    systemStatusLabel: string;
  };
};
