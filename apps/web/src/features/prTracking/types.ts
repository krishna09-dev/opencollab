// apps/web/src/features/prTracking/types.ts

export type PrStatus = "ACCEPTED" | "PR_OPEN" | "MERGED" | "CLOSED";
export type PrStatusFilter = "All" | PrStatus;

export type PrFilterState = {
  q: string;
  status: PrStatusFilter;
  repo: "All" | string;
};

export type PrTrackingItem = {
  id: string;
  title: string;

  repoFullName: string; // "org/repo"
  issueNumber: number;
  prNumber?: number | null;

  status: PrStatus;

  updatedAtLabel?: string; // UI-friendly label for now
  shortSummary?: string;

  messagesCount?: number;
  lastMessagePreview?: string;
};

export type PrListResponse = {
  items: PrTrackingItem[];
  total: number;
};

export type PrMessageKind = "comment" | "system";

export type PrMessage = {
  id: string;
  author: string; // "you" | "maintainer" | "system" (for now)
  createdAtLabel: string; // "2m ago", "1d ago"
  text: string;
  kind?: PrMessageKind;
};