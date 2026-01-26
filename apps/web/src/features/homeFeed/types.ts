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
  status: IssueStatus;
}
