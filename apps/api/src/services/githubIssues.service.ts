import axios from "axios";
import { GITHUB } from "../config/github";
import { normalizeLabel } from "../utils/label";
import { handleRateLimitFromHeaders, retryWithBackoff } from "./rateLimit.service";

type GitHubSearchItem = any;

export type IngestedIssueDTO = {
  githubNumber: number;
  repoOwner: string;
  repoName: string;
  repoLanguage: string | null;

  title: string;
  body: string;
  summary: string;
  labels: string[];

  githubUrl: string;
  githubCreatedAt: Date;
  githubUpdatedAt: Date;

  // Your schema has these:
  status: "open";
  openedAt: Date;

  beginnerFriendly: boolean;
  recentlyUpdated: boolean;
};

function buildQuery(params: {
  owner: string;
  repo: string;
  sinceISO?: string;
}) {
  // Pull all open issues for the repo, then classify difficulty locally.
  const parts = [
    `repo:${params.owner}/${params.repo}`,
    `is:issue`,
    `is:open`
  ];

  // ✅ incremental sync
  if (params.sinceISO) {
    parts.push(`updated:>=${params.sinceISO}`);
  }

  return parts.join(" ");
}

function isBeginnerLabel(label: string): boolean {
  const normalized = normalizeLabel(label);
  return (
    normalized === "good first issue" ||
    normalized === "good-first-issue" ||
    normalized === "help wanted" ||
    normalized.includes("beginner") ||
    normalized.includes("easy") ||
    normalized.includes("starter") ||
    normalized.includes("first-timer") ||
    normalized.includes("documentation") ||
    normalized.includes("docs") ||
    normalized.includes("typo")
  );
}

function mapToDTO(item: GitHubSearchItem, owner: string, repo: string, repoLanguage: string | null): IngestedIssueDTO {
  const labels = (item.labels || []).map((l: any) => normalizeLabel(l.name));

  const ghCreated = new Date(item.created_at);
  const ghUpdated = new Date(item.updated_at);
  const beginnerFriendly = labels.some(isBeginnerLabel);

  return {
    githubNumber: item.number,
    repoOwner: owner,
    repoName: repo,
    repoLanguage,

    title: item.title || "",
    body: item.body || "",
    summary: "", // Sprint 6 can generate summary;
    labels,

    githubUrl: item.html_url,
    githubCreatedAt: ghCreated,
    githubUpdatedAt: ghUpdated,

    status: "open",
    openedAt: ghCreated,

    beginnerFriendly,
    recentlyUpdated: true
  };
}

export async function fetchOpenIssuesForRepo(params: {
  owner: string;
  repo: string;
  sinceISO?: string;
  repoLanguage?: string | null;
  githubToken?: string;
}) {
  const token = params.githubToken || process.env.GITHUB_SYSTEM_TOKEN;
  if (!token) {
    throw new Error("GitHub token is not configured");
  }

  const all: IngestedIssueDTO[] = [];
  let fetchedCount = 0;
  const maxPages = GITHUB.maxPagesPerRepo ?? GITHUB.maxPagesPerLabel;

  for (let page = 1; page <= maxPages; page++) {
    const q = buildQuery({
      owner: params.owner,
      repo: params.repo,
      sinceISO: params.sinceISO
    });

    const res = await retryWithBackoff(() =>
      axios.get(`${GITHUB.apiBaseUrl}/search/issues`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json"
        },
        params: {
          q,
          per_page: GITHUB.perPage,
          page
        }
      })
    );

    await handleRateLimitFromHeaders(res.headers);

    const items = res.data?.items || [];
    fetchedCount += items.length;

    for (const it of items) {
      all.push(mapToDTO(it, params.owner, params.repo, params.repoLanguage ?? null));
    }

    if (items.length < GITHUB.perPage) break;
  }

  return { issues: all, fetchedCount };
}

// Backward-compatible alias used by older imports.
export const fetchBeginnerOpenIssuesForRepo = fetchOpenIssuesForRepo;