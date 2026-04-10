export type IssueStatus = "open" | "claimed" | "closed";
export type PrStatus = "NONE" | "PR_OPEN" | "MERGED" | "CLOSED";

export type SuggestedResource = { title: string; url: string; type?: string | null };

export type IssueUpdateItem = {
  id: string;
  actorLogin: string;
  actorRole?: string | null;
  body: string;
  createdAt: string | Date;
};

export type TimelineItem = {
  id: string;
  title: string;
  status: string;
  at: string | Date;
  meta?: string | null;
};

export interface RepoHealth {
  healthScore: number;
  activityScore: number;
  openIssues: number;
  recentCommits: number;
}

export interface SetupInstruction {
  label: string;
  command: string;
}

export interface IssueDto {
  _id: string;
  githubNumber: number;
  repoOwner: string;
  repoName: string;
  repoLanguage?: string | null;
  difficulty?: "beginner" | "intermediate" | "advanced";
  difficultyOverride?: "beginner" | "intermediate" | "advanced" | null;

  title: string;
  body: string;
  summary: string;
  labels: string[];

  status: IssueStatus;
  claimedByUserId?: string | null;
  claimedByLogin?: string | null;

  githubUrl: string;
  githubCreatedAt: string | Date;
  githubUpdatedAt: string | Date;

  openedAt: string | Date;
  claimedAt?: string | Date | null;

  requiredSkills: string[];
  expectedOutcome: string[];
  suggestedResources: SuggestedResource[];

  repoHealth: RepoHealth;
  beginnerFriendly: boolean;
  activeMaintainer: boolean;
  recentlyUpdated: boolean;

  autoSetupCommands: SetupInstruction[];
  projectSetupCommands?: SetupInstruction[];
  maintainerSetupNotes?: string | null;
  repositoryReadme?: string | null;
  repositoryReadmeUrl?: string | null;

  prStatus: PrStatus;
  lastPrMessage?: string | null;

  updates: IssueUpdateItem[];
  contributionTimeline: TimelineItem[];

  notifyWatchers: string[];
}

export interface CurrentUser {
  id: string;
  login: string;
  email?: string;
  avatarUrl?: string;
  role?: "user" | "admin";
}

export interface NotificationDto {
  id: string;
  type: "ISSUE_AVAILABLE";
  issueId: string;
  issueTitle: string;
  createdAt: string;
  read: boolean;
}

export type PrTrackingStatus = "PR_OPEN" | "MERGED" | "CLOSED";

export interface PrTrackingDto {
  _id: string;
  userId: string;
  issueId?: string | null;
  repoFullName: string;
  prNumber?: number | null;
  prTitle?: string | null;
  prUrl?: string | null;
  prState?: "open" | "closed" | null;
  status: string;
  additions?: number;
  deletions?: number;
  changedFiles?: number;
  createdAtGithub?: string | null;
  updatedAtGithub?: string | null;
  mergedAtGithub?: string | null;
  lastSyncAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
