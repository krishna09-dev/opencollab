import { api, authHeaders } from "../../../lib/api";
import type { GoodFirstIssue, GoodFirstIssuesFilters, GoodFirstIssuesPagination, DifficultyLevel } from "../types";

export interface GoodFirstIssuesResponse {
  issues: GoodFirstIssue[];
  pagination: GoodFirstIssuesPagination;
}

/**
 * Determines difficulty level based on issue properties
 * This logic identifies issues appropriate for different skill levels
 */
export function calculateDifficulty(issue: any): DifficultyLevel {
  const labels = (issue.labels || []).map((l: string) => l.toLowerCase());
  const skills = (issue.requiredSkills || []).length;
  const bodyLength = (issue.body || "").length;

  // Beginner indicators
  const beginnerLabels = [
    "good first issue",
    "good-first-issue",
    "beginner",
    "easy",
    "starter",
    "first-timers-only",
    "documentation",
    "docs",
    "typo",
    "help wanted"
  ];

  const hasBeginnerLabel = labels.some((l: string) =>
    beginnerLabels.some(bl => l.includes(bl))
  );

  if (issue.beginnerFriendly || hasBeginnerLabel) {
    return "beginner";
  }

  // Advanced indicators
  const advancedLabels = [
    "complex",
    "advanced",
    "architecture",
    "breaking",
    "major",
    "refactor",
    "performance",
    "security"
  ];

  const hasAdvancedLabel = labels.some((l: string) =>
    advancedLabels.some(al => l.includes(al))
  );

  // Advanced if: has advanced labels, many skills required, or long issue body
  if (hasAdvancedLabel || skills > 5 || bodyLength > 2000) {
    return "advanced";
  }

  // Everything else is intermediate
  return "intermediate";
}

export async function fetchGoodFirstIssues(
  filters: GoodFirstIssuesFilters = {}
): Promise<GoodFirstIssuesResponse> {
  const params = new URLSearchParams();
  const needsClientFilter = filters.difficulty && filters.difficulty !== "beginner";
  const page = filters.page || 1;
  const limit = filters.limit || 10;

  if (needsClientFilter) {
    // Fetch a large batch for client-side difficulty filtering (must match fetchDifficultyCounts limit)
    params.set("page", "1");
    params.set("limit", "500");
  } else {
    if (filters.page) params.set("page", String(filters.page));
    if (filters.limit) params.set("limit", String(filters.limit));
  }

  if (filters.language) params.set("language", filters.language);
  if (filters.search) params.set("search", filters.search);

  // For beginner difficulty, we can use the existing beginnerFriendly filter
  if (filters.difficulty === "beginner") {
    params.set("difficulty", "beginner");
  }

  // Only get open issues
  params.set("status", "open");

  const res = await api.get<{ issues: any[]; pagination: GoodFirstIssuesPagination }>(
    `/api/issues?${params.toString()}`,
    { headers: authHeaders() }
  );

  // Enrich issues with calculated difficulty
  const enrichedIssues: GoodFirstIssue[] = res.data.issues.map(issue => ({
    ...issue,
    difficulty: calculateDifficulty(issue)
  }));

  // If filtering by non-beginner difficulty, do client-side filtering with proper pagination
  if (needsClientFilter) {
    const allFiltered = enrichedIssues.filter(
      issue => issue.difficulty === filters.difficulty
    );
    const total = allFiltered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const startIdx = (page - 1) * limit;
    const paginatedIssues = allFiltered.slice(startIdx, startIdx + limit);

    return {
      issues: paginatedIssues,
      pagination: { page, limit, total, totalPages }
    };
  }

  return {
    issues: enrichedIssues,
    pagination: res.data.pagination
  };
}

export interface DifficultyCounts {
  beginner: number;
  intermediate: number;
  advanced: number;
}

/**
 * Fetches a large batch of open issues and counts them by computed difficulty.
 * Used for the sidebar stats panel.
 */
export async function fetchDifficultyCounts(): Promise<DifficultyCounts> {
  const res = await api.get<{ issues: any[] }>(
    `/api/issues?status=open&limit=500`,
    { headers: authHeaders() }
  );

  const counts: DifficultyCounts = { beginner: 0, intermediate: 0, advanced: 0 };
  for (const issue of res.data.issues) {
    const diff = calculateDifficulty(issue);
    counts[diff]++;
  }
  return counts;
}

export async function fetchRecommendedGoodFirstIssues(
  userLevel: DifficultyLevel,
  topN: number = 10
): Promise<GoodFirstIssue[]> {
  // Fetch a large pool so we have enough after difficulty filtering
  const res = await api.get<{ issues: any[]; pagination: GoodFirstIssuesPagination }>(
    `/api/issues?status=open&limit=500`,
    { headers: authHeaders() }
  );

  // Enrich with difficulty and filter based on user level
  const enrichedIssues: GoodFirstIssue[] = res.data.issues.map(issue => ({
    ...issue,
    difficulty: calculateDifficulty(issue)
  }));

  // Only show issues that match the user's selected level
  const recommended = enrichedIssues
    .filter(i => i.difficulty === userLevel)
    .sort((a, b) => (a.requiredSkills || []).length - (b.requiredSkills || []).length);

  // Add match scores based on position
  return recommended.slice(0, topN).map((issue, index) => ({
    ...issue,
    matchScore: Math.round(100 - (index * 5)) // Decrease score by 5 for each position
  }));
}
