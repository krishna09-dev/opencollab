import { api, authHeaders } from "../../../lib/api";
import type { ResourceFilterState, ResourceItem, ResourceCategory, ResourceType, ResourceDifficulty } from "../types";

/** ================= BACKEND TYPES ================= */

type BackendResourceType = "docs" | "article" | "video" | "tool" | "repo";
type BackendResourceDifficulty = "beginner" | "intermediate" | "advanced";
type BackendResourceSource = "official" | "community";
type BackendResourceStatus = "approved" | "pending" | "rejected";

type BackendResource = {
  _id: string;
  title: string;
  url: string;
  description?: string;

  category?: string;
  type: BackendResourceType;
  difficulty: BackendResourceDifficulty;

  tags?: string[];
  topics?: string[];
  language?: string | null;

  isFeatured?: boolean;
  qualityScore?: number;

  // ✅ NEW (from backend)
  source?: BackendResourceSource; // official/community
  status?: BackendResourceStatus; // approved/pending/rejected
  submittedBy?: string | null;

  createdAt?: string;
  updatedAt?: string;
};

type BackendResourcesResponse = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  featured: BackendResource[];
  items: BackendResource[];
};

/** ================= CATEGORY MAPPING ================= */

const RESOURCE_CATEGORIES: ResourceCategory[] = [
  "Git Basics",
  "Pull Requests",
  "Programming Docs",
  "CLI Mastery",
  "Bug Fixing"
];

const categoryToLegacyTopics: Record<ResourceCategory, string[]> = {
  "Git Basics": ["workflow"],
  "Pull Requests": ["pr"],
  "Programming Docs": ["setup", "testing", "ci-cd"],
  "CLI Mastery": ["cli"],
  "Bug Fixing": ["debugging"]
};

function inferCategoryFromBackend(r: BackendResource): ResourceCategory {
  const direct = String(r.category || "").trim() as ResourceCategory;
  if (RESOURCE_CATEGORIES.includes(direct)) return direct;

  const topics = (r.topics ?? []).map((x) => String(x).toLowerCase());
  const tags = (r.tags ?? []).map((x) => String(x).toLowerCase());
  const type = String(r.type).toLowerCase();

  if (topics.includes("pr") || tags.includes("pull-request") || tags.includes("github") || tags.includes("review")) return "Pull Requests";
  if (topics.includes("workflow") || tags.includes("git") || tags.includes("commit") || tags.includes("branch") || tags.includes("merge")) return "Git Basics";
  if (topics.includes("debugging") || tags.includes("bug") || tags.includes("debug") || tags.includes("fix") || tags.includes("troubleshooting")) return "Bug Fixing";
  if (tags.includes("cli") || tags.includes("terminal") || tags.includes("shell") || tags.includes("command-line")) return "CLI Mastery";
  if (topics.includes("docs") || tags.includes("docs") || tags.includes("documentation") || tags.includes("readme") || tags.includes("contributing-guide")) return "Programming Docs";
  if (topics.includes("setup") || topics.includes("testing") || topics.includes("ci-cd") || tags.includes("tutorial") || tags.includes("guide") || type === "docs") return "Programming Docs";

  return "Programming Docs";
}

function mapBackendTypeToUiType(t: BackendResourceType): ResourceType {
  if (t === "docs") return "docs";
  if (t === "video") return "video";
  if (t === "article") return "article";
  // backend tool/repo → treat as "guide" in UI
  return "guide";
}

function mapBackendDifficultyToUiDifficulty(d: BackendResourceDifficulty): ResourceDifficulty {
  return d;
}

/**
 * ✅ NEW: official/community should come from backend "source".
 * fallback to heuristic only if backend doesn't send it yet.
 */
function inferSourceFallback(r: BackendResource): "official" | "community" {
  const url = (r.url ?? "").toLowerCase();
  if (url.includes("docs.github.com")) return "official";
  if (url.includes("jestjs.io/docs")) return "official";
  return "community";
}

function mapBackendToResourceItem(r: BackendResource): ResourceItem {
  const source = r.source ?? inferSourceFallback(r);
  const status = r.status ?? "approved";

  return {
    id: r._id,
    title: r.title,
    url: r.url,
    description: r.description ?? "",
    category: inferCategoryFromBackend(r),
    difficulty: mapBackendDifficultyToUiDifficulty(r.difficulty),
    type: mapBackendTypeToUiType(r.type),
    language: r.language ?? null,
    isFeatured: !!r.isFeatured,

    isOfficial: source === "official",
    tags: r.tags ?? [],
    source,
    status
  };
}

function buildParams(filters: ResourceFilterState) {
  const params = new URLSearchParams();

  const q = filters.q.trim();
  if (q) params.set("q", q);

  // backend expects type: docs/article/video/tool/repo
  // UI has: docs/video/article/guide/cheatsheet
  if (filters.type !== "All") {
    if (filters.type === "docs" || filters.type === "video" || filters.type === "article") {
      params.set("type", filters.type);
    }
  }

  if (filters.difficulty !== "All") params.set("difficulty", filters.difficulty);

  if (filters.language !== "All" && filters.language.trim()) {
    params.set("language", filters.language.trim());
  }

  if (filters.category !== "All") {
    params.set("category", filters.category);
  }

  params.set("limit", "80");
  params.set("page", "1");

  return params;
}

/** ================= API CALLS ================= */

export async function fetchResources(filters: ResourceFilterState): Promise<{
  featured: ResourceItem[];
  items: ResourceItem[];
  total: number;
}> {
  const params = buildParams(filters);

  const res = await api.get<BackendResourcesResponse>(`/api/resources?${params.toString()}`, {
    headers: authHeaders()
  });

  const featured = (res.data.featured ?? []).map(mapBackendToResourceItem);
  const items = (res.data.items ?? []).map(mapBackendToResourceItem);

  // UI-only type filter for guide/cheatsheet
  const finalItems =
    filters.type === "guide"
      ? items.filter((x) => x.type === "guide")
      : filters.type === "cheatsheet"
      ? items.filter((x) => x.type === "cheatsheet")
      : items;

  const finalFeatured =
    filters.type === "guide"
      ? featured.filter((x) => x.type === "guide")
      : filters.type === "cheatsheet"
      ? featured.filter((x) => x.type === "cheatsheet")
      : featured;

  return { featured: finalFeatured, items: finalItems, total: res.data.total ?? finalItems.length };
}

export type SuggestResourceInput = {
  title: string;
  url: string;
  description: string;
  category: ResourceCategory;
  difficulty: ResourceDifficulty;
  type: ResourceType;
  language: string | null;
  tags: string[];
};

export async function suggestResource(input: SuggestResourceInput): Promise<{ message: string; id: string }> {
  const topics = categoryToLegacyTopics[input.category] ?? [];

  // Map UI types "guide"/"cheatsheet" to backend "tool"
  let backendType: string = input.type;
  if (input.type === "guide" || input.type === "cheatsheet") {
    backendType = "tool";
  }

  const res = await api.post<{ message: string; id: string }>(
    "/api/resources/suggest",
    {
      title: input.title,
      url: input.url,
      description: input.description,
      category: input.category,
      type: backendType,
      difficulty: input.difficulty,
      tags: input.tags,
      topics,
      language: input.language
    },
    { headers: authHeaders() }
  );
  return res.data;
}