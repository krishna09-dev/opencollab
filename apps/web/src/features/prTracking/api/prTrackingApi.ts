// apps/web/src/features/prTracking/api/prTrackingApi.ts
import { api, authHeaders } from "../../../lib/api";
import type {
  PrDetailResponse,
  PrDisplayStatus,
  PrFilterState,
  PrListResponse,
  PrMessage,
  PrStatus,
  PrTrackingItem
} from "../types";

/* ======================================================
   BACKEND RESPONSE SHAPES
   ====================================================== */

type BackendPrItem = {
  _id: string;
  userId: string;
  repoFullName: string;
  issueNumber: number;
  issueTitle?: string;
  prNumber?: number | null;
  prTitle?: string | null;
  prBody?: string | null;
  prUrl?: string | null;
  prUpdatedAt?: string | null;
  primaryLanguage?: string | null;
  commentsCount?: number;
  reviewCommentsCount?: number;
  prState?: "open" | "closed" | null;
  mergedAt?: string | null;
  closedAt?: string | null;
  status: "ACCEPTED" | "PR_OPEN" | "MERGED" | "CLOSED";
  displayStatus?: PrDisplayStatus;
  lastSyncAt?: string | null;
  syncSource?: "manual" | "worker";
  createdAt?: string;
  updatedAt?: string;
};

type BackendListResponse = {
  summary: {
    total: number;
    open: number;
    inReview?: number;
    changesRequested?: number;
    merged: number;
    accepted?: number;
    closed?: number;
  };
  items: BackendPrItem[];
};

/* ======================================================
   HELPERS
   ====================================================== */

function timeAgo(dateStr?: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function normalizeDisplayStatus(status: PrStatus, displayStatus?: PrDisplayStatus): PrDisplayStatus {
  if (displayStatus) return displayStatus;
  if (status === "MERGED") return "MERGED";
  return "OPEN";
}

function toPreview(text?: string | null): string | undefined {
  if (!text) return undefined;
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) return undefined;
  return compact.length > 150 ? `${compact.slice(0, 150)}...` : compact;
}

function extractPrNumber(prNumber?: number | null, prUrl?: string | null): number | null {
  if (typeof prNumber === "number" && Number.isFinite(prNumber)) return prNumber;
  if (!prUrl) return null;
  const match = String(prUrl).match(/\/pull\/(\d+)(?:\D|$)/i);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapBackendItem(b: BackendPrItem): PrTrackingItem {
  const status = b.status;
  return {
    id: b._id,
    title: b.prTitle || b.issueTitle || `Issue #${b.issueNumber}`,
    repoFullName: b.repoFullName,
    issueNumber: b.issueNumber,
    prNumber: extractPrNumber(b.prNumber ?? null, b.prUrl ?? null),
    prTitle: b.prTitle ?? null,
    prBody: b.prBody ?? null,
    prUrl: b.prUrl ?? null,
    prUpdatedAt: b.prUpdatedAt ?? null,
    primaryLanguage: b.primaryLanguage ?? null,
    commentsCount: b.commentsCount ?? 0,
    reviewCommentsCount: b.reviewCommentsCount ?? 0,
    status,
    displayStatus: normalizeDisplayStatus(status, b.displayStatus),
    updatedAtLabel: b.prUpdatedAt
      ? `${timeAgo(b.prUpdatedAt)}`
      : b.updatedAt
        ? `${timeAgo(b.updatedAt)}`
        : undefined,
    shortSummary: toPreview(b.prBody),
    lastSyncAt: b.lastSyncAt ?? null
  };
}

/* ======================================================
   🧪 DUMMY DATA (fallback when backend unreachable)
   ====================================================== */

const DUMMY_ITEMS: PrTrackingItem[] = [
  {
    id: "1",
    title: "refactor: Optimize Reconciliation algorithm for concurrent mode",
    repoFullName: "facebook/react",
    issueNumber: 402,
    prNumber: 28491,
    status: "PR_OPEN",
    displayStatus: "IN_REVIEW",
    updatedAtLabel: "2d ago",
    shortSummary: "This PR introduces a more efficient way to track pending fiber updates by utilizing bitmasks instead of array iterations in the main render loop.",
    primaryLanguage: "TypeScript",
    messagesCount: 2,
    commentsCount: 2,
    reviewCommentsCount: 8
  },
  {
    id: "2",
    title: "fix: Edge Runtime compatibility for middleware auth",
    repoFullName: "vercel/next.js",
    issueNumber: 1203,
    prNumber: 54122,
    status: "PR_OPEN",
    displayStatus: "CHANGES_REQUESTED",
    updatedAtLabel: "5d ago",
    shortSummary: "Addressing compatibility issues when using the native crypto API in Vercel Edge functions within the middleware layer.",
    primaryLanguage: "JavaScript",
    messagesCount: 5,
    commentsCount: 1,
    reviewCommentsCount: 15
  },
  {
    id: "3",
    title: "feat: Add support for custom separator in utility classes",
    repoFullName: "tailwindlabs/tailwindcss",
    issueNumber: 884,
    prNumber: 11094,
    status: "MERGED",
    displayStatus: "MERGED",
    updatedAtLabel: "1w ago",
    shortSummary: "Implements the ability to define a custom separator other than ':' for variant modifiers in the tailwind.config.js file.",
    primaryLanguage: "JavaScript",
    commentsCount: 3,
    reviewCommentsCount: 4
  },
  {
    id: "4",
    title: "fix: Correct narrowing for Union types with overlapping literal properties",
    repoFullName: "microsoft/typescript",
    issueNumber: 58922,
    prNumber: 59201,
    status: "PR_OPEN",
    displayStatus: "OPEN",
    updatedAtLabel: "3h ago",
    shortSummary: "Resolves a bug where the checker incorrectly widened a union type when checking for exhaustiveness in switch statements.",
    primaryLanguage: "TypeScript",
    commentsCount: 0,
    reviewCommentsCount: 1,
    messagesCount: 1,
    lastMessagePreview: "Status changed to OPEN"
  }
];

const DUMMY_MESSAGES: Record<string, PrMessage[]> = {
  "1": [
    { id: "m1", author: "you", createdAtLabel: "18h ago", text: "I've implemented the tracking endpoints. Please review the status mapping logic." },
    { id: "m2", author: "maintainer", createdAtLabel: "12h ago", text: "Looks good. Please add pagination for list endpoint." },
    { id: "m3", author: "system", createdAtLabel: "2m ago", text: "Status changed to PR_OPEN", kind: "system" }
  ],
  "2": [
    { id: "m21", author: "system", createdAtLabel: "1d ago", text: "Status changed to MERGED", kind: "system" }
  ],
  "3": [
    { id: "m31", author: "system", createdAtLabel: "4d ago", text: "Status changed to CLOSED", kind: "system" }
  ]
};

const DUMMY_DETAIL: Record<string, PrDetailResponse> = {
  "1": {
    id: "1",
    title: "Refactor Authentication Flow",
    number: 42,
    owner: "opencollab",
    repo: "core-engine",
    status: "CHANGES_REQUESTED",
    sourceBranch: "auth-refactor",
    targetBranch: "main",
    tags: ["Enhancement", "Auth"],
    overview: {
      author: "alex_dev",
      commentedAtLabel: "3 hours ago",
      intro:
        "This PR replaces the legacy session-based authentication with a more robust JWT-based flow. It includes the following changes:",
      changes: [
        "Implemented AuthService using jsonwebtoken.",
        "Added middleware for token verification on protected routes.",
        "Updated client-side state management to handle token persistence.",
        "Refactored /login and /register endpoints."
      ],
      note: "This requires a new environment variable JWT_SECRET to be set in production.",
      linkedIssue: {
        number: 123,
        title: "Implement Secure Auth Flow",
        openedBy: "systems_lead"
      }
    },
    timeline: [
      { id: "opened", type: "opened", actor: "alex_dev", text: "opened this pull request", atLabel: "3 hours ago" },
      {
        id: "commits",
        type: "commits",
        commits: [
          { sha: "a7b2c4e", message: "feat: implement jwt generation logic", atLabel: "2 hours ago" },
          { sha: "8d9f1e2", message: "fix: middleware error handling", atLabel: "1 hour ago" }
        ]
      },
      { id: "review", type: "reviewRequested", actor: "alex_dev", reviewers: ["mike_ux", "sarah_tech"] },
      {
        id: "changes",
        type: "changesRequested",
        actor: "mike_ux",
        atLabel: "45 mins ago",
        summary:
          "The token expiration is currently set to 30 days. We should reduce this to 1 hour and implement refresh tokens for better security.",
        diffOld: "expiresIn: '30d'",
        diffNew: "expiresIn: '1h'"
      },
      {
        id: "maintainer",
        type: "maintainerFeedback",
        title: "Maintainer Feedback",
        body:
          "Great overall implementation. Please address Mike's concern regarding the expiration time. Once that's done and CI checks pass, I'm ready to merge."
      },
      {
        id: "restriction",
        type: "restriction",
        body: "Conversation is restricted to maintainers or authorized reviewers"
      }
    ],
    sidebar: {
      reviewers: [
        { id: "sarah", name: "sarah_tech", status: "approved" },
        { id: "mike", name: "mike_ux", status: "changes_requested" },
        { id: "john", name: "john_dev", status: "pending" }
      ],
      checks: [
        { id: "vercel", name: "Vercel Deployment", status: "success", durationLabel: "2m", progress: 100 },
        { id: "unit", name: "Unit Tests (154/154)", status: "success", durationLabel: "4m", progress: 100 },
        { id: "e2e", name: "E2E Tests", status: "running", durationLabel: "Running...", progress: 65 }
      ],
      filesChangedTotal: 4,
      filesChanged: [
        { path: "src/services/auth.ts", additions: 124, deletions: 12 },
        { path: "src/middleware/auth.ts", additions: 45, deletions: 0 },
        { path: "src/routes/login.ts", additions: 12, deletions: 30 }
      ],
      linkedIssue: { number: 123, title: "Implement Secure Auth Flow", openedBy: "systems_lead" },
      systemStatusLabel: "All systems operational"
    }
  }
};

function dummySummary(items: PrTrackingItem[]) {
  const ui = (status: PrDisplayStatus) => items.filter((x) => (x.displayStatus ?? normalizeDisplayStatus(x.status)) === status).length;
  return {
    total: items.length,
    open: ui("OPEN"),
    inReview: ui("IN_REVIEW"),
    changesRequested: ui("CHANGES_REQUESTED"),
    merged: ui("MERGED"),
    accepted: items.filter((x) => x.status === "ACCEPTED").length,
    closed: items.filter((x) => x.status === "CLOSED").length
  };
}

function matchesQuery(item: PrTrackingItem, q: string) {
  const hay = `${item.title} ${item.repoFullName} ${item.issueNumber} ${item.prNumber ?? ""}`.toLowerCase();
  return hay.includes(q.toLowerCase());
}

/* ======================================================
   📡 API FUNCTIONS
   ====================================================== */

/**
 * GET list of PR tracking records
 * Backend: GET /api/pr-tracking
 */
export async function fetchPrList(filters: PrFilterState): Promise<PrListResponse> {
  try {
    const res = await api.get<BackendListResponse>("/api/pr-tracking", {
      headers: authHeaders()
    });

    let items = res.data.items.map(mapBackendItem);

    // client-side filtering (backend returns all items for the user)
    const q = filters.q.trim().toLowerCase();
    if (filters.status !== "All") {
      items = items.filter((x) => {
        const displayStatus = x.displayStatus ?? normalizeDisplayStatus(x.status);
        return displayStatus === filters.status || x.status === filters.status;
      });
    }
    if (filters.repo !== "All") items = items.filter((x) => x.repoFullName === filters.repo);
    if (q) items = items.filter((x) => matchesQuery(x, q));

    return {
      items,
      total: items.length,
      summary: res.data.summary
    };
  } catch (e: any) {
    // Fallback to dummy data if backend is unreachable
    if (e?.response?.status === 401 || e?.code === "ERR_NETWORK") {
      let items = [...DUMMY_ITEMS];
      const q = filters.q.trim().toLowerCase();
      if (filters.status !== "All") {
        items = items.filter((x) => {
          const displayStatus = x.displayStatus ?? normalizeDisplayStatus(x.status);
          return displayStatus === filters.status || x.status === filters.status;
        });
      }
      if (filters.repo !== "All") items = items.filter((x) => x.repoFullName === filters.repo);
      if (q) items = items.filter((x) => matchesQuery(x, q));
      return { items, total: items.length, summary: dummySummary(DUMMY_ITEMS) };
    }
    throw e;
  }
}

/**
 * GET messages for a PR
 * Backend: GET /api/pr-tracking/:id/messages (not yet implemented in backend)
 * Falls back to dummy messages for now
 */
export async function fetchPrMessages(prId: string): Promise<PrMessage[]> {
  return DUMMY_MESSAGES[prId] ?? [];
}

/**
 * Manual refresh using user token
 * Backend: POST /api/pr-tracking/refresh
 */
export async function manualRefreshAll(): Promise<{ message: string; updated: number }> {
  const res = await api.post<{ message: string; updated: number }>(
    "/api/pr-tracking/refresh",
    {},
    { headers: authHeaders() }
  );
  return res.data;
}

/**
 * Refresh a single PR tracking record
 * Backend: POST /api/pr-tracking/refresh
 */
export async function refreshSinglePr(id: string): Promise<{ message: string; updated: number }> {
  const res = await api.post<{ message: string; updated: number }>(
    "/api/pr-tracking/refresh",
    { id },
    { headers: authHeaders() }
  );
  return res.data;
}

export async function fetchPrDetail(id: string): Promise<PrDetailResponse> {
  try {
    const res = await api.get<PrDetailResponse>(`/api/pr-tracking/${id}/detail`, {
      headers: authHeaders()
    });
    return res.data;
  } catch (e: any) {
    if (e?.response?.status === 401 || e?.response?.status === 404 || e?.code === "ERR_NETWORK") {
      return DUMMY_DETAIL[id] ?? DUMMY_DETAIL["1"];
    }
    throw e;
  }
}

export async function seedDemoPrTracking(): Promise<{ message: string; inserted: number; ids: string[] }> {
  const res = await api.post<{ message: string; inserted: number; ids: string[] }>(
    "/api/pr-tracking/seed-demo",
    {},
    { headers: authHeaders() }
  );
  return res.data;
}

/**
 * Add a PR by URL
 * Backend: POST /api/pr-tracking/add
 */
export async function addPrByUrl(prUrl: string): Promise<{ message: string; item: any; created: boolean }> {
  const res = await api.post<{ message: string; item: any }>(
    "/api/pr-tracking/add",
    { prUrl },
    { headers: authHeaders() }
  );
  return { ...res.data, created: res.status === 201 };
}
