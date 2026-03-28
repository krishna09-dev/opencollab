export interface MeResponse {
  login: string;
}

export interface IssueStatsResponse {
  total: number;
  open: number;
  beginner: number;
}

export type IssueStatus = "open" | "claimed" | "closed";

export interface IssueRow {
  _id: string;
  githubNumber: number;
  repoOwner: string;
  repoName: string;
  title: string;
  body: string;
  summary: string;
  status: IssueStatus;
  labels: string[];
  requiredSkills: string[];
  beginnerFriendly: boolean;
  githubCreatedAt: string;
  githubUpdatedAt: string;
  claimedByLogin?: string | null;
  githubUrl: string;
  commentsCount?: number;
}

export interface FeedPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FeedResponse {
  issues: IssueRow[];
  pagination: FeedPagination;
}

export interface FeedFilters {
  page?: number;
  limit?: number;
  status?: string;
  language?: string;
  difficulty?: string;
  search?: string;
  sort?: string;
}
