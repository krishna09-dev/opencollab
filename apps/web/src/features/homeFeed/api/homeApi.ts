import { api, authHeaders } from "../../../lib/api";
import type { MeResponse, IssueStatsResponse, FeedResponse, FeedFilters } from "../types";

export async function fetchMe() {
  const res = await api.get<MeResponse>("/api/me", { headers: authHeaders() });
  return res.data;
}

export async function fetchIssueStats() {
  const res = await api.get<IssueStatsResponse>("/api/issues/stats", { headers: authHeaders() });
  return res.data;
}

export async function fetchAvailableIssueLanguages() {
  const res = await api.get<{ languages: string[] }>("/api/issues/languages", {
    headers: authHeaders()
  });
  return res.data.languages || [];
}

export async function fetchFeed(filters: FeedFilters = {}) {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.status) params.set("status", filters.status);
  if (filters.language) params.set("language", filters.language);
  if (filters.difficulty) params.set("difficulty", filters.difficulty);
  if (filters.search) params.set("search", filters.search);
  if (filters.sort) params.set("sort", filters.sort);

  const res = await api.get<FeedResponse>(`/api/issues?${params.toString()}`, {
    headers: authHeaders()
  });
  return res.data;
}

export interface RecommendationItem {
  issue_id: string;
  repo_name: string;
  issue_title: string;
  language: string;
  difficulty: string;
  labels: string;
  topics: string;
  similarity_score: number;
  summary?: string;
  body?: string;
  claimed_by?: string;
  issue_status?: "open" | "claimed" | "closed";
}

export interface RecommendationsResponse {
  recommendations: RecommendationItem[];
  method: string;
  userProfile: {
    languages?: string[];
    difficulty?: string;
    topics?: string[];
  };
  error?: string;
}

export async function fetchRecommendations(topN: number = 10) {
  const res = await api.get<RecommendationsResponse>(
    `/api/recommendations?top_n=${topN}`,
    { headers: authHeaders() }
  );
  return res.data;
}
