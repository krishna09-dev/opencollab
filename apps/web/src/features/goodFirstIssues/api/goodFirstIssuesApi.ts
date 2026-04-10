import { api, authHeaders } from "../../../lib/api";
import type { GoodFirstIssue, GoodFirstIssuesFilters, GoodFirstIssuesPagination, DifficultyLevel } from "../types";

export interface GoodFirstIssuesResponse {
  issues: GoodFirstIssue[];
  pagination: GoodFirstIssuesPagination;
}

function normalizeDifficulty(value?: string | null): DifficultyLevel | null {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "beginner" || normalized === "intermediate" || normalized === "advanced") {
    return normalized;
  }
  return null;
}

/**
 * Determines difficulty level based on issue properties
 * This logic identifies issues appropriate for different skill levels
 */
export function calculateDifficulty(issue: any): DifficultyLevel {
  const explicit = normalizeDifficulty(issue?.difficulty) || normalizeDifficulty(issue?.difficultyOverride);
  if (explicit) {
    return explicit;
  }

  const labels = (issue.labels || []).map((l: string) => l.toLowerCase());
  const skills = (issue.requiredSkills || []).length;
  const bodyLength = (issue.body || "").length;

  const advancedLabels = [
    "complex", "advanced", "architecture", "breaking", "major",
    "refactor", "performance", "security", "expert", "hard", "difficult"
  ];

  const beginnerLabels = [
    "good first issue", "good-first-issue", "help wanted",
    "beginner", "easy", "starter", "first-timers-only",
    "first-timer", "documentation", "docs", "typo"
  ];

  const hasAdvancedSignals = labels.some((l: string) =>
    advancedLabels.some(al => l.includes(al))
  ) || skills > 5 || bodyLength > 2000;

  const hasBeginnerSignals = issue.beginnerFriendly || labels.some((l: string) =>
    beginnerLabels.some(bl => l.includes(bl))
  );

  if (hasBeginnerSignals && !hasAdvancedSignals) return "beginner";
  if (hasAdvancedSignals && !hasBeginnerSignals) return "advanced";
  return "intermediate";
}

export async function fetchGoodFirstIssues(
  filters: GoodFirstIssuesFilters = {}
): Promise<GoodFirstIssuesResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  if (filters.language) params.set("language", filters.language);
  if (filters.search) params.set("search", filters.search);
  if (filters.difficulty) params.set("difficulty", filters.difficulty);

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
  const getTotalFor = async (difficulty: DifficultyLevel) => {
    const params = new URLSearchParams({ status: "open", difficulty, limit: "1", page: "1" });
    const res = await api.get<{ pagination: GoodFirstIssuesPagination }>(
      `/api/issues?${params.toString()}`,
      { headers: authHeaders() }
    );
    return res.data.pagination.total;
  };

  const [beginner, intermediate, advanced] = await Promise.all([
    getTotalFor("beginner"),
    getTotalFor("intermediate"),
    getTotalFor("advanced")
  ]);

  return { beginner, intermediate, advanced };
}

export async function fetchRecommendedGoodFirstIssues(
  userLevel: DifficultyLevel,
  topN: number = 10
): Promise<GoodFirstIssue[]> {
  const params = new URLSearchParams({ status: "open", difficulty: userLevel, limit: "500", page: "1" });
  const res = await api.get<{ issues: any[]; pagination: GoodFirstIssuesPagination }>(
    `/api/issues?${params.toString()}`,
    { headers: authHeaders() }
  );

  // Enrich with difficulty for a consistent UI type.
  const enrichedIssues: GoodFirstIssue[] = res.data.issues.map(issue => ({
    ...issue,
    difficulty: calculateDifficulty(issue)
  }));

  const recommended = enrichedIssues
    .sort((a, b) => (a.requiredSkills || []).length - (b.requiredSkills || []).length);

  // Add match scores based on position
  return recommended.slice(0, topN).map((issue, index) => ({
    ...issue,
    matchScore: Math.round(100 - (index * 5)) // Decrease score by 5 for each position
  }));
}
