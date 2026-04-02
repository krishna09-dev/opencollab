export interface UserProfile {
  id: string;
  login: string;
  email?: string;
  avatarUrl?: string;
  preferredLanguages: string[];
  experienceLevel: "beginner" | "intermediate" | "advanced";
  areasOfInterest: string[];
  createdAt: string;
}

export interface UpdateProfileData {
  email?: string;
  preferredLanguages?: string[];
  experienceLevel?: "beginner" | "intermediate" | "advanced";
  areasOfInterest?: string[];
}

// GitHub activity stats
export interface GitHubStats {
  commits: number;
  pullRequests: number;
  issues: number;
  codeReviews: number;
  publicRepos: number;
  followers: number;
}

export type ContributionSource = "open-collab" | "github";

// Contribution graph data
export interface ContributionDay {
  date: string;
  count: number;
  level: number; // 0-4 for color intensity
}

export interface ContributionWeek {
  days: ContributionDay[];
}

export interface ContributionData {
  source?: ContributionSource;
  totalContributions: number;
  weeks: ContributionWeek[];
}

export type ProfileActivityType = "issue_claimed" | "pr_opened" | "pr_merged" | "pr_closed";

export interface ProfileActivityItem {
  id: string;
  type: ProfileActivityType;
  title: string;
  description: string;
  at: string;
  url: string | null;
}

export interface ClaimedIssueItem {
  _id: string;
  githubNumber: number;
  repoOwner: string;
  repoName: string;
  repoLanguage?: string | null;
  title: string;
  body: string;
  summary: string;
  labels: string[];
  status: "open" | "claimed" | "closed";
  claimedAt?: string | null;
  claimedByLogin?: string | null;
  githubUrl: string;
  prStatus?: "NONE" | "PR_OPEN" | "MERGED" | "CLOSED";
  githubCreatedAt: string;
  githubUpdatedAt: string;
  commentsCount?: number;
}

export interface ClaimedIssuesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ClaimedIssuesResponse {
  issues: ClaimedIssueItem[];
  pagination: ClaimedIssuesPagination;
}
