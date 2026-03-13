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

  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
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

  // If filtering by difficulty (not beginner which is already filtered server-side)
  let filteredIssues = enrichedIssues;
  if (filters.difficulty && filters.difficulty !== "beginner") {
    filteredIssues = enrichedIssues.filter(
      issue => issue.difficulty === filters.difficulty
    );
  }

  return {
    issues: filteredIssues,
    pagination: res.data.pagination
  };
}

export async function fetchRecommendedGoodFirstIssues(
  userLevel: DifficultyLevel,
  topN: number = 10
): Promise<GoodFirstIssue[]> {
  // Fetch all open issues
  const res = await api.get<{ issues: any[]; pagination: GoodFirstIssuesPagination }>(
    `/api/issues?status=open&limit=50`,
    { headers: authHeaders() }
  );

  // Enrich with difficulty and filter based on user level
  const enrichedIssues: GoodFirstIssue[] = res.data.issues.map(issue => ({
    ...issue,
    difficulty: calculateDifficulty(issue)
  }));

  // Recommendation logic based on user skill level
  let recommended: GoodFirstIssue[] = [];

  if (userLevel === "beginner") {
    // For beginners: show only beginner issues, sorted by simplicity
    recommended = enrichedIssues
      .filter(i => i.difficulty === "beginner")
      .sort((a, b) => {
        // Prioritize issues with fewer required skills
        const skillsA = (a.requiredSkills || []).length;
        const skillsB = (b.requiredSkills || []).length;
        return skillsA - skillsB;
      });
  } else if (userLevel === "intermediate") {
    // For intermediate: show beginner and intermediate, prioritize intermediate
    const intermediate = enrichedIssues.filter(i => i.difficulty === "intermediate");
    const beginner = enrichedIssues.filter(i => i.difficulty === "beginner");
    recommended = [...intermediate, ...beginner];
  } else {
    // For advanced: show all difficulties, prioritize advanced and intermediate
    const advanced = enrichedIssues.filter(i => i.difficulty === "advanced");
    const intermediate = enrichedIssues.filter(i => i.difficulty === "intermediate");
    const beginner = enrichedIssues.filter(i => i.difficulty === "beginner");
    recommended = [...advanced, ...intermediate, ...beginner];
  }

  // Add match scores based on position
  return recommended.slice(0, topN).map((issue, index) => ({
    ...issue,
    matchScore: Math.round(100 - (index * 5)) // Decrease score by 5 for each position
  }));
}
