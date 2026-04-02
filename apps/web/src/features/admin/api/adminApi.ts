import { api } from "../../../lib/api";

const authHeaders = () => {
  const token =
    localStorage.getItem("oc_admin_token") || localStorage.getItem("oc_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ========== Types ==========

export type IssueDifficulty = "beginner" | "intermediate" | "advanced";

export interface ApprovedRepo {
  _id: string;
  fullName: string;
  repoOwner: string;
  repoName: string;
  description?: string | null;
  htmlUrl?: string | null;
  isActive: boolean;
  lastSyncedAt?: string | null;
  lastRunAt?: string | null;
  lastError?: string | null;
  lastErrorAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminIssue {
  _id: string;
  githubNumber: number;
  repoOwner: string;
  repoName: string;
  title: string;
  status: "open" | "claimed" | "closed";
  labels: string[];
  beginnerFriendly: boolean;
  difficulty?: IssueDifficulty;
  isApproved: boolean;
  isVisible: boolean;
  githubCreatedAt: string;
  githubUpdatedAt: string;
  githubUrl: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IssueStats {
  total: number;
  approved: number;
  visible: number;
  pending: number;
  beginnerFriendly: number;
}

export type RequestStatus = "pending" | "approved" | "rejected";
export type ResourceCategory =
  | "Git Basics"
  | "Pull Requests"
  | "Programming Docs"
  | "CLI Mastery"
  | "Bug Fixing";

export interface RepoRequestItem {
  _id: string;
  fullName: string;
  repoOwner: string;
  repoName: string;
  approvedRepoId?: string | null;
  description?: string | null;
  htmlUrl?: string | null;
  language?: string | null;
  requestNotes?: string | null;
  requestedByLogin: string;
  requestedByRole: "moderator" | "admin";
  status: RequestStatus;
  reviewNotes?: string | null;
  reviewedByLogin?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceRequestItem {
  _id: string;
  title: string;
  url: string;
  description?: string;
  category: ResourceCategory;
  type: "docs" | "article" | "video" | "tool" | "repo";
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
  topics: string[];
  language?: string | null;
  isFeatured: boolean;
  qualityScore: number;
  source: "official" | "community";
  status: RequestStatus;
  reviewNotes?: string | null;
  reviewedByLogin?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FetchRequestsParams {
  page?: number;
  limit?: number;
  status?: RequestStatus;
  search?: string;
}

export interface FetchApprovedResourcesParams {
  page?: number;
  limit?: number;
  search?: string;
  source?: "official" | "community";
}

export async function submitRepoRequest(
  fullName: string,
  requestNotes?: string
): Promise<{ message: string; request: RepoRequestItem }> {
  const res = await api.post(
    "/api/moderator/repo-requests",
    { fullName, requestNotes },
    { headers: authHeaders() }
  );
  return res.data;
}

export async function fetchMyRepoRequests(
  params: FetchRequestsParams = {}
): Promise<{ requests: RepoRequestItem[]; pagination: Pagination }> {
  const res = await api.get("/api/moderator/repo-requests", {
    params,
    headers: authHeaders()
  });
  return res.data;
}

export async function fetchAdminRepoRequests(
  params: FetchRequestsParams = {}
): Promise<{ requests: RepoRequestItem[]; pagination: Pagination }> {
  const res = await api.get("/api/admin/repo-requests", {
    params,
    headers: authHeaders()
  });
  return res.data;
}

export async function approveRepoRequest(
  id: string,
  payload: { reviewNotes?: string; syncNow?: boolean } = {}
): Promise<{
  message: string;
  request: RepoRequestItem;
  repo: ApprovedRepo;
  sync?: { success?: boolean; error?: string | null; skipped?: boolean };
}> {
  const res = await api.post(`/api/admin/repo-requests/${id}/approve`, payload, {
    headers: authHeaders()
  });
  return res.data;
}

export async function rejectRepoRequest(
  id: string,
  reason?: string
): Promise<{ message: string; request: RepoRequestItem }> {
  const res = await api.post(
    `/api/admin/repo-requests/${id}/reject`,
    { reason },
    { headers: authHeaders() }
  );
  return res.data;
}

export type SubmitResourceRequestInput = {
  title: string;
  url: string;
  description: string;
  category: ResourceCategory;
  type?: "docs" | "article" | "video" | "tool" | "repo";
  difficulty?: "beginner" | "intermediate" | "advanced";
  tags?: string[];
  topics?: string[];
  language?: string | null;
};

export type CreateAdminResourceInput = SubmitResourceRequestInput & {
  isFeatured?: boolean;
  qualityScore?: number;
};

export type UpdateApprovedResourceInput = {
  title?: string;
  url?: string;
  description?: string;
  category?: ResourceCategory;
  type?: "docs" | "article" | "video" | "tool" | "repo";
  difficulty?: "beginner" | "intermediate" | "advanced";
  tags?: string[];
  topics?: string[];
  language?: string | null;
  isFeatured?: boolean;
  qualityScore?: number;
};

export async function submitResourceRequest(
  input: SubmitResourceRequestInput
): Promise<{ message: string; id: string }> {
  const res = await api.post(
    "/api/resources/suggest",
    {
      title: input.title,
      url: input.url,
      description: input.description,
      category: input.category,
      type: input.type || "article",
      difficulty: input.difficulty || "beginner",
      tags: input.tags || [],
      topics: input.topics || [],
      language: input.language || null
    },
    { headers: authHeaders() }
  );
  return res.data;
}

export async function createAdminResource(
  input: CreateAdminResourceInput
): Promise<{ message: string; resource: ResourceRequestItem }> {
  const res = await api.post(
    "/api/admin/resources",
    {
      title: input.title,
      url: input.url,
      description: input.description,
      category: input.category,
      type: input.type || "article",
      difficulty: input.difficulty || "beginner",
      tags: input.tags || [],
      topics: input.topics || [],
      language: input.language || null,
      isFeatured: Boolean(input.isFeatured),
      qualityScore: input.qualityScore
    },
    { headers: authHeaders() }
  );
  return res.data;
}

export async function fetchMyResourceRequests(
  params: FetchRequestsParams = {}
): Promise<{ requests: ResourceRequestItem[]; pagination: Pagination }> {
  const res = await api.get("/api/moderator/resource-requests", {
    params,
    headers: authHeaders()
  });
  return res.data;
}

export async function fetchAdminResourceRequests(
  params: FetchRequestsParams = {}
): Promise<{ requests: ResourceRequestItem[]; pagination: Pagination }> {
  const res = await api.get("/api/admin/resource-requests", {
    params,
    headers: authHeaders()
  });
  return res.data;
}

export async function fetchApprovedResources(
  params: FetchApprovedResourcesParams = {}
): Promise<{ items: ResourceRequestItem[]; pagination: Pagination }> {
  const page = params.page || 1;
  const limit = params.limit || 20;

  const res = await api.get("/api/resources", {
    params: {
      page,
      limit,
      q: params.search?.trim() || undefined,
      source: params.source || undefined
    },
    headers: authHeaders()
  });

  return {
    items: res.data.items || [],
    pagination: {
      page: res.data.page || page,
      limit: res.data.limit || limit,
      total: res.data.total || 0,
      totalPages: res.data.totalPages || 0
    }
  };
}

export async function updateApprovedResource(
  id: string,
  input: UpdateApprovedResourceInput
): Promise<{ message: string; resource: ResourceRequestItem }> {
  const payload: Record<string, unknown> = {};

  if (input.title !== undefined) payload.title = input.title;
  if (input.url !== undefined) payload.url = input.url;
  if (input.description !== undefined) payload.description = input.description;
  if (input.category !== undefined) payload.category = input.category;
  if (input.type !== undefined) payload.type = input.type;
  if (input.difficulty !== undefined) payload.difficulty = input.difficulty;
  if (input.tags !== undefined) payload.tags = input.tags;
  if (input.topics !== undefined) payload.topics = input.topics;
  if (input.language !== undefined) payload.language = input.language;
  if (input.isFeatured !== undefined) payload.isFeatured = input.isFeatured;
  if (input.qualityScore !== undefined) payload.qualityScore = input.qualityScore;

  const res = await api.patch(`/api/admin/resources/${id}`, payload, {
    headers: authHeaders()
  });
  return res.data;
}

export async function deleteApprovedResource(
  id: string
): Promise<{ message: string }> {
  const res = await api.delete(`/api/admin/resources/${id}`, {
    headers: authHeaders()
  });
  return res.data;
}

export async function approveResourceRequest(
  id: string,
  payload: { reviewNotes?: string; isFeatured?: boolean; qualityScore?: number } = {}
): Promise<{ message: string; resource: ResourceRequestItem }> {
  const res = await api.post(`/api/admin/resource-requests/${id}/approve`, payload, {
    headers: authHeaders()
  });
  return res.data;
}

export async function rejectResourceRequest(
  id: string,
  reason?: string
): Promise<{ message: string; resource: ResourceRequestItem }> {
  const res = await api.post(
    `/api/admin/resource-requests/${id}/reject`,
    { reason },
    { headers: authHeaders() }
  );
  return res.data;
}

// ========== Repo API ==========

export async function fetchAdminRepos(): Promise<ApprovedRepo[]> {
  const res = await api.get("/api/admin/repos", { headers: authHeaders() });
  return res.data.repos;
}

export async function addRepo(fullName: string): Promise<ApprovedRepo> {
  const res = await api.post(
    "/api/admin/repos",
    { fullName },
    { headers: authHeaders() }
  );
  return res.data.repo;
}

export async function updateRepo(
  id: string,
  updates: { isActive?: boolean; description?: string }
): Promise<ApprovedRepo> {
  const res = await api.patch(`/api/admin/repos/${id}`, updates, {
    headers: authHeaders()
  });
  return res.data.repo;
}

export async function deleteRepo(id: string): Promise<void> {
  await api.delete(`/api/admin/repos/${id}`, { headers: authHeaders() });
}

export async function syncRepo(
  id: string
): Promise<{ message: string; result: unknown }> {
  const res = await api.post(
    `/api/admin/repos/${id}/sync`,
    {},
    { headers: authHeaders() }
  );
  return res.data;
}

// ========== Issue API ==========

export interface FetchIssuesParams {
  page?: number;
  limit?: number;
  status?: string;
  difficulty?: IssueDifficulty;
  isApproved?: string;
  isVisible?: string;
  search?: string;
  repoFullName?: string;
}

export interface IssueRepositorySummary {
  repoOwner: string;
  repoName: string;
  fullName: string;
  totalIssues: number;
  openIssues: number;
  claimedIssues: number;
  closedIssues: number;
  approvedIssues: number;
  pendingIssues: number;
  visibleIssues: number;
}

export async function fetchAdminIssues(
  params: FetchIssuesParams = {}
): Promise<{ issues: AdminIssue[]; pagination: Pagination }> {
  const res = await api.get("/api/admin/issues", {
    params,
    headers: authHeaders()
  });
  return res.data;
}

export async function fetchIssueRepositories(
  params: Omit<FetchIssuesParams, "page" | "limit" | "repoFullName"> = {}
): Promise<{ repositories: IssueRepositorySummary[] }> {
  const res = await api.get("/api/admin/issues/repositories", {
    params,
    headers: authHeaders()
  });
  return res.data;
}

export async function fetchIssueStats(): Promise<IssueStats> {
  const res = await api.get("/api/admin/issues/stats", {
    headers: authHeaders()
  });
  return res.data;
}

export async function updateIssue(
  id: string,
  updates: { isApproved?: boolean; isVisible?: boolean; difficulty?: IssueDifficulty }
): Promise<AdminIssue> {
  const res = await api.patch(`/api/admin/issues/${id}`, updates, {
    headers: authHeaders()
  });
  return res.data.issue;
}

export async function approveIssue(id: string): Promise<AdminIssue> {
  const res = await api.post(
    `/api/admin/issues/${id}/approve`,
    {},
    { headers: authHeaders() }
  );
  return res.data.issue;
}

export async function rejectIssue(id: string): Promise<AdminIssue> {
  const res = await api.post(
    `/api/admin/issues/${id}/reject`,
    {},
    { headers: authHeaders() }
  );
  return res.data.issue;
}

export async function toggleIssueVisibility(
  id: string
): Promise<{ isVisible: boolean }> {
  const res = await api.post(
    `/api/admin/issues/${id}/toggle-visibility`,
    {},
    { headers: authHeaders() }
  );
  return res.data.issue;
}

export async function bulkApproveIssues(
  ids: string[]
): Promise<{ modifiedCount: number }> {
  const res = await api.post(
    "/api/admin/issues/bulk-approve",
    { ids },
    { headers: authHeaders() }
  );
  return res.data;
}

export async function bulkSetVisibility(
  ids: string[],
  isVisible: boolean
): Promise<{ modifiedCount: number }> {
  const res = await api.post(
    "/api/admin/issues/bulk-visibility",
    { ids, isVisible },
    { headers: authHeaders() }
  );
  return res.data;
}

// ========== Claims API ==========

export interface ClaimedIssue {
  _id: string;
  githubNumber: number;
  repoOwner: string;
  repoName: string;
  title: string;
  status: string;
  claimedByUserId: string | null;
  claimedByLogin: string | null;
  claimedAt: string | null;
  githubUrl: string;
  prStatus?: string;
  isStale: boolean;
  daysSinceClaim: number;
}

export interface ClaimStats {
  totalClaimed: number;
  stale7Days: number;
  stale14Days: number;
  withPrOpen: number;
  withPrMerged: number;
  activeClaims: number;
}

export interface FetchClaimsParams {
  page?: number;
  limit?: number;
  staleOnly?: string;
  staleDays?: number;
  search?: string;
  repoFullName?: string;
}

export async function fetchClaimedIssues(
  params: FetchClaimsParams = {}
): Promise<{ issues: ClaimedIssue[]; pagination: Pagination }> {
  const res = await api.get("/api/admin/claims", {
    params,
    headers: authHeaders()
  });
  return res.data;
}

export async function fetchClaimStats(): Promise<ClaimStats> {
  const res = await api.get("/api/admin/claims/stats", {
    headers: authHeaders()
  });
  return res.data;
}

export async function fetchClaimDetails(id: string): Promise<{
  issue: ClaimedIssue;
  claimant: { login: string; avatarUrl: string; email?: string } | null;
  daysSinceClaim: number;
}> {
  const res = await api.get(`/api/admin/claims/${id}`, {
    headers: authHeaders()
  });
  return res.data;
}

export async function forceReleaseClaim(
  id: string,
  reason?: string
): Promise<{ message: string; issue: { _id: string; title: string; previousClaimant: string } }> {
  const res = await api.post(
    `/api/admin/claims/${id}/force-release`,
    { reason },
    { headers: authHeaders() }
  );
  return res.data;
}

// ========== PR Verification API ==========

export interface PrTrackingAdmin {
  _id: string;
  userId: { _id: string; login: string; avatarUrl?: string } | null;
  repoFullName: string;
  issueNumber: number;
  prNumber: number | null;
  prTitle: string | null;
  prUrl: string | null;
  prState: string | null;
  prAuthor: string | null;
  status: "ACCEPTED" | "PR_OPEN" | "MERGED" | "CLOSED";
  isVerified: boolean;
  verifiedBy: { _id: string; login: string } | null;
  verifiedAt: string | null;
  isValid: boolean | null;
  verificationNote: string | null;
  difficulty?: "beginner" | "intermediate" | "advanced";
  createdAt: string;
  additions?: number;
  deletions?: number;
  changedFiles?: number;
}

export interface PrStats {
  totalPrs: number;
  pendingVerification: number;
  verified: number;
  validPrs: number;
  invalidPrs: number;
  merged: number;
  prOpen: number;
}

export interface PrRepositorySummary {
  repoFullName: string;
  totalPrs: number;
  pendingVerification: number;
  verified: number;
  validPrs: number;
  invalidPrs: number;
  merged: number;
  prOpen: number;
}

export interface FetchPrsParams {
  page?: number;
  limit?: number;
  isVerified?: string;
  isValid?: string;
  status?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  search?: string;
  repoFullName?: string;
}

export async function fetchAdminPrs(
  params: FetchPrsParams = {}
): Promise<{ prs: PrTrackingAdmin[]; pagination: Pagination }> {
  const res = await api.get("/api/admin/prs", {
    params,
    headers: authHeaders()
  });
  return res.data;
}

export async function fetchPrStats(): Promise<PrStats> {
  const res = await api.get("/api/admin/prs/stats", {
    headers: authHeaders()
  });
  return res.data;
}

export async function fetchPrRepositories(
  params: Omit<FetchPrsParams, "page" | "limit"> = {}
): Promise<{ repositories: PrRepositorySummary[] }> {
  const res = await api.get("/api/admin/prs/repositories", {
    params,
    headers: authHeaders()
  });
  return res.data;
}

export async function fetchPrDetails(id: string): Promise<PrTrackingAdmin> {
  const res = await api.get(`/api/admin/prs/${id}`, {
    headers: authHeaders()
  });
  return res.data;
}

export async function verifyPr(
  id: string,
  isValid: boolean,
  note?: string
): Promise<{ message: string; pr: { _id: string; isVerified: boolean; isValid: boolean } }> {
  const res = await api.post(
    `/api/admin/prs/${id}/verify`,
    { isValid, note },
    { headers: authHeaders() }
  );
  return res.data;
}

export async function detachPr(
  id: string
): Promise<{ message: string; detachedPrUrl: string }> {
  const res = await api.post(
    `/api/admin/prs/${id}/detach`,
    {},
    { headers: authHeaders() }
  );
  return res.data;
}

export async function resetPrVerification(
  id: string
): Promise<{ message: string; pr: { _id: string; isVerified: boolean } }> {
  const res = await api.post(
    `/api/admin/prs/${id}/reset-verification`,
    {},
    { headers: authHeaders() }
  );
  return res.data;
}

export async function deleteAllPrs(): Promise<{
  message: string;
  deletedCount: number;
  issueResetCount: number;
}> {
  const res = await api.delete("/api/admin/prs", {
    headers: authHeaders()
  });
  return res.data;
}

// ========== Analytics API ==========

export interface PlatformAnalytics {
  overview: {
    users: {
      total: number;
      newLast30Days: number;
      withActiveClaims: number;
      withPrs: number;
    };
    issues: {
      total: number;
      open: number;
      claimed: number;
      closed: number;
      approved: number;
      visible: number;
      beginnerFriendly: number;
      newLast30Days: number;
    };
    prs: {
      total: number;
      open: number;
      merged: number;
      closed: number;
      newLast30Days: number;
      newLast7Days: number;
    };
    ml: {
      issuesScored: number;
      issuesWithOverride: number;
      averageScore: number;
      scoringCoverage: number;
    };
    recommendations: {
      totalClicks: number;
      totalClaims: number;
      totalCompletions: number;
      successRate: number;
      completionRate: number;
    };
    reports: {
      total: number;
      pending: number;
      resolved: number;
      newLast30Days: number;
    };
    repositories: {
      total: number;
      active: number;
    };
  };
  timeSeries: {
    issues: Array<{ _id: string; count: number }>;
    claims: Array<{ _id: string; count: number }>;
    mergedPrs: Array<{ _id: string; count: number }>;
  };
  topContributors: Array<{
    userId: string;
    login: string;
    avatarUrl?: string;
    mergedPrCount: number;
  }>;
  topRepositories: Array<{
    repoFullName: string;
    totalIssues: number;
    claimedIssues: number;
  }>;
}

export async function fetchAnalytics(): Promise<PlatformAnalytics> {
  const res = await api.get("/api/admin/analytics", {
    headers: authHeaders()
  });
  return res.data;
}

// ========== ML Scoring API ==========

export interface MlFeatures {
  labelScore: number;
  descriptionLength: number;
  keywordScore: number;
  complexityScore: number;
  clarityScore: number;
}

export interface MlScoring {
  beginnerScore: number;
  confidence: number;
  features: MlFeatures;
  explanation: string;
  scoredAt: string;
  modelVersion: string;
}

export interface MlOverride {
  overriddenBy: string;
  overriddenAt: string;
  originalScore: number;
  newScore: number;
  reason: string;
}

export interface MlScoredIssue {
  _id: string;
  githubNumber: number;
  repoOwner: string;
  repoName: string;
  title: string;
  labels: string[];
  beginnerFriendly: boolean;
  mlScoring?: MlScoring | null;
  mlOverride?: MlOverride | null;
  status: string;
  githubUrl: string;
  effectiveScore?: number | null;
  hasDisagreement: boolean;
}

export interface MlStats {
  totalScored: number;
  totalUnscored: number;
  totalOverrides: number;
  averageScore: number;
  highScoreCount: number;
  lowScoreCount: number;
  disagreements: number;
  scoringCoverage: number;
}

export interface FetchMlIssuesParams {
  page?: number;
  limit?: number;
  minScore?: string;
  maxScore?: string;
  hasOverride?: string;
  disagreement?: string;
  search?: string;
}

export async function scoreIssue(issueId: string): Promise<{
  message: string;
  issueId: string;
  mlScoring: MlScoring;
}> {
  const res = await api.post(
    `/api/ml/score/${issueId}`,
    {},
    { headers: authHeaders() }
  );
  return res.data;
}

export async function scoreBatchIssues(issueIds: string[]): Promise<{
  message: string;
  results: Array<{
    issueId: string;
    success: boolean;
    mlScoring?: MlScoring;
    error?: string;
  }>;
}> {
  const res = await api.post(
    "/api/ml/score-batch",
    { issueIds },
    { headers: authHeaders() }
  );
  return res.data;
}

export async function overrideMlScore(
  issueId: string,
  newScore: number,
  reason: string
): Promise<{
  message: string;
  issueId: string;
  override: MlOverride & { overriddenByLogin: string };
}> {
  const res = await api.post(
    `/api/ml/override/${issueId}`,
    { newScore, reason },
    { headers: authHeaders() }
  );
  return res.data;
}

export async function removeOverride(issueId: string): Promise<{
  message: string;
  issueId: string;
}> {
  const res = await api.delete(`/api/ml/override/${issueId}`, {
    headers: authHeaders()
  });
  return res.data;
}

export async function fetchMlScoredIssues(
  params: FetchMlIssuesParams = {}
): Promise<{ issues: MlScoredIssue[]; pagination: Pagination }> {
  const res = await api.get("/api/ml/issues", {
    params,
    headers: authHeaders()
  });
  return res.data;
}

export async function fetchMlStats(): Promise<MlStats> {
  const res = await api.get("/api/ml/stats", {
    headers: authHeaders()
  });
  return res.data;
}

export async function scoreAllUnscored(): Promise<{
  message: string;
  scoredCount: number;
  failedCount: number;
  remaining: number;
}> {
  const res = await api.post(
    "/api/ml/score-all-unscored",
    {},
    { headers: authHeaders() }
  );
  return res.data;
}
