import { api, authHeaders } from "../../../lib/api";
import type { MeResponse, IssueStatsResponse, IssueRow } from "../types";

export async function fetchMe() {
  const res = await api.get<MeResponse>("/api/me", { headers: authHeaders() });
  return res.data;
}

export async function fetchIssueStats() {
  const res = await api.get<IssueStatsResponse>("/api/issues/stats", { headers: authHeaders() });
  return res.data;
}

export async function fetchIssues() {
  const res = await api.get<IssueRow[]>("/api/issues", { headers: authHeaders() });
  return Array.isArray(res.data) ? res.data : [];
}
