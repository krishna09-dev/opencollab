// apps/web/src/features/prTracking/api/prTrackingApi.ts
import { api, authHeaders } from "../../../lib/api";
import type {
  PrFilterState,
  PrListResponse,
  PrMessage,
  PrTrackingItem
} from "../types";

/* ======================================================
   🔧 CONFIG
   ====================================================== */

// ✅ Sprint 4: keep dummy ON
// ✅ Sprint 5+: flip to false (or use env)
const USE_DUMMY_PR_TRACKING = true;
// const USE_DUMMY_PR_TRACKING = import.meta.env.VITE_USE_DUMMY_PR === "true";

/* ======================================================
   🧪 DUMMY DATA (Sprint 4)
   ====================================================== */

const DUMMY_ITEMS: PrTrackingItem[] = [
  {
    id: "1",
    title: "Add PR tracking status chips to UI",
    repoFullName: "opencollab/web",
    issueNumber: 142,
    prNumber: 57,
    status: "PR_OPEN",
    updatedAtLabel: "Updated 2m ago",
    shortSummary: "Adds PR list + detail tracking view.",
    messagesCount: 2,
    lastMessagePreview: "Please add pagination…"
  },
  {
    id: "2",
    title: "Fix resources seed + add status/source fields",
    repoFullName: "opencollab/api",
    issueNumber: 133,
    prNumber: 41,
    status: "MERGED",
    updatedAtLabel: "Updated 1d ago",
    shortSummary: "Schema defaults + route updates.",
    messagesCount: 5,
    lastMessagePreview: "Merged ✅"
  },
  {
    id: "3",
    title: "Refactor auth middleware typings",
    repoFullName: "opencollab/api",
    issueNumber: 128,
    prNumber: 38,
    status: "CLOSED",
    updatedAtLabel: "Updated 4d ago",
    shortSummary: "Fixes AuthRequest userId patterns.",
    messagesCount: 1,
    lastMessagePreview: "Closing due to conflict"
  }
];

const DUMMY_MESSAGES: Record<string, PrMessage[]> = {
  "1": [
    {
      id: "m1",
      author: "you",
      createdAtLabel: "18h ago",
      text: "I’ve implemented the tracking endpoints. Please review the status mapping logic."
    },
    {
      id: "m2",
      author: "maintainer",
      createdAtLabel: "12h ago",
      text: "Looks good. Please add pagination for list endpoint."
    },
    {
      id: "m3",
      author: "system",
      createdAtLabel: "2m ago",
      text: "Status changed to PR_OPEN",
      kind: "system"
    }
  ],
  "2": [
    {
      id: "m21",
      author: "system",
      createdAtLabel: "1d ago",
      text: "Status changed to MERGED",
      kind: "system"
    }
  ],
  "3": [
    {
      id: "m31",
      author: "system",
      createdAtLabel: "4d ago",
      text: "Status changed to CLOSED",
      kind: "system"
    }
  ]
};

/* ======================================================
   🧠 HELPERS
   ====================================================== */

function matchesQuery(item: PrTrackingItem, q: string) {
  const hay = `${item.title} ${item.repoFullName} ${item.issueNumber} ${item.prNumber ?? ""}`.toLowerCase();
  return hay.includes(q.toLowerCase());
}

/* ======================================================
   📡 API FUNCTIONS (Dummy + Real)
   ====================================================== */

/**
 * GET list of PR tracking records
 * Backend: GET /api/pr-tracking
 */
export async function fetchPrList(filters: PrFilterState): Promise<PrListResponse> {
  if (USE_DUMMY_PR_TRACKING) {
    const q = filters.q.trim();
    let items = [...DUMMY_ITEMS];

    if (filters.status !== "All") items = items.filter((x) => x.status === filters.status);
    if (filters.repo !== "All") items = items.filter((x) => x.repoFullName === filters.repo);
    if (q) items = items.filter((x) => matchesQuery(x, q));

    return {
      items,
      total: items.length
    };
  }

  // 🔴 REAL BACKEND
  const params = new URLSearchParams();

  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.status !== "All") params.set("status", filters.status);
  if (filters.repo !== "All") params.set("repo", filters.repo);

  const res = await api.get<PrListResponse>(
    `/api/pr-tracking?${params.toString()}`,
    { headers: authHeaders() }
  );

  return res.data;
}

/**
 * GET messages for a PR
 * Backend: GET /api/pr-tracking/:id/messages
 */
export async function fetchPrMessages(prId: string): Promise<PrMessage[]> {
  if (USE_DUMMY_PR_TRACKING) {
    return DUMMY_MESSAGES[prId] ?? [];
  }

  const res = await api.get<{ items: PrMessage[] }>(
    `/api/pr-tracking/${prId}/messages`,
    { headers: authHeaders() }
  );

  return res.data.items;
}

/**
 * Manual refresh using user token
 * Backend: POST /api/pr-tracking/refresh
 */
export async function manualRefreshAll(): Promise<void> {
  if (USE_DUMMY_PR_TRACKING) {
    console.info("[PR Tracking] Dummy manual refresh");
    return;
  }

  await api.post(
    "/api/pr-tracking/refresh",
    {},
    { headers: authHeaders() }
  );
}

/**
 * Run dummy worker manually (DEV only)
 * Backend: POST /api/pr-tracking/worker/run
 */
export async function runDummyWorkerNow(): Promise<void> {
  if (USE_DUMMY_PR_TRACKING) {
    console.info("[PR Tracking] Dummy worker executed");
    return;
  }

  await api.post(
    "/api/pr-tracking/worker/run",
    {},
    { headers: authHeaders() }
  );
}