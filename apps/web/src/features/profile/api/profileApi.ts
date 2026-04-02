import { api, authHeaders } from "../../../lib/api";
import type {
  UserProfile,
  UpdateProfileData,
  GitHubStats,
  ContributionData,
  ClaimedIssuesResponse,
  ContributionSource,
  ProfileActivityItem
} from "../types";

export async function fetchProfile(): Promise<UserProfile> {
  const res = await api.get<UserProfile>("/api/me", { headers: authHeaders() });
  return res.data;
}

export async function updateProfile(data: UpdateProfileData): Promise<UserProfile> {
  const res = await api.put<UserProfile>("/api/me/profile", data, { headers: authHeaders() });
  return res.data;
}

export async function fetchGitHubStats(): Promise<GitHubStats> {
  const res = await api.get<GitHubStats>("/api/me/github-stats", { headers: authHeaders() });
  return res.data;
}

export async function fetchContributions(
  source: ContributionSource = "open-collab"
): Promise<ContributionData> {
  const res = await api.get<ContributionData>(`/api/me/contributions?source=${source}`, {
    headers: authHeaders()
  });
  return res.data;
}

export async function fetchRecentActivities(limit = 5): Promise<ProfileActivityItem[]> {
  const res = await api.get<{ activities: ProfileActivityItem[] }>(
    `/api/me/recent-activities?limit=${limit}`,
    { headers: authHeaders() }
  );
  return res.data.activities;
}

export async function fetchMyClaimedIssues(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: "all" | "claimed" | "closed";
} = {}): Promise<ClaimedIssuesResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const res = await api.get<ClaimedIssuesResponse>(`/api/me/claimed-issues${suffix}`, {
    headers: authHeaders()
  });
  return res.data;
}
