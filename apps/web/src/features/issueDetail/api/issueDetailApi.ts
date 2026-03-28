import { api, authHeaders } from "../../../lib/api";
import type { IssueDto, CurrentUser, NotificationDto } from "../types";

export async function fetchIssue(id: string) {
  const res = await api.get<IssueDto>(`/api/issues/${id}`, { headers: authHeaders() });
  return res.data;
}

export async function claimIssue(id: string) {
  const res = await api.post<{ message: string; issue: IssueDto }>(
    `/api/issues/${id}/claim`,
    {},
    { headers: authHeaders() }
  );
  return res.data;
}

export async function abortIssue(id: string) {
  const res = await api.post<{ message: string; issue: IssueDto }>(
    `/api/issues/${id}/abort`,
    {},
    { headers: authHeaders() }
  );
  return res.data;
}

export async function notifyIssue(id: string) {
  const res = await api.post<{ message: string; issue: IssueDto }>(
    `/api/issues/${id}/notify`,
    {},
    { headers: authHeaders() }
  );
  return res.data;
}

export async function fetchCurrentUser() {
  const res = await api.get<CurrentUser>("/api/me", { headers: authHeaders() });
  return res.data;
}

export async function fetchNotifications() {
  const res = await api.get<NotificationDto[]>("/api/notifications", { headers: authHeaders() });
  return res.data;
}
