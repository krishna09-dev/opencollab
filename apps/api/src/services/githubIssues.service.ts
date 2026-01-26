import axios from "axios";
import { GITHUB } from "../config/github";
import { normalizeLabel } from "../utils/label";
import { handleRateLimitFromHeaders, retryWithBackoff } from "./rateLimit.service";

type GitHubSearchItem = any;

export type IngestedIssueDTO = {
  githubNumber: number;
  repoOwner: string;
  repoName: string;

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
  label: string;
  sinceISO?: string;
}) {
  // ✅ Must filter at GitHub API level
  // is:open + label: + repo:
  const parts = [
    `repo:${params.owner}/${params.repo}`,
    `is:issue`,
    `is:open`,
    `label:"${params.label}"`
  ];

  // ✅ incremental sync
  if (params.sinceISO) {
    parts.push(`updated:>=${params.sinceISO}`);
  }

  return parts.join(" ");
}

function mapToDTO(item: GitHubSearchItem, owner: string, repo: string): IngestedIssueDTO {
  const labels = (item.labels || []).map((l: any) => normalizeLabel(l.name));

  const ghCreated = new Date(item.created_at);
  const ghUpdated = new Date(item.updated_at);

  return {
    githubNumber: item.number,
    repoOwner: owner,
    repoName: repo,

    title: item.title || "",
    body: item.body || "",
    summary: "", // Sprint 6 can generate summary;
    labels,

    githubUrl: item.html_url,
    githubCreatedAt: ghCreated,
    githubUpdatedAt: ghUpdated,

    status: "open",
    openedAt: ghCreated,

    beginnerFriendly: true,
    recentlyUpdated: true
  };
}

export async function fetchBeginnerOpenIssuesForRepo(params: {
  owner: string;
  repo: string;
  sinceISO?: string;
}) {
  const token = process.env.GITHUB_SYSTEM_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN missing in .env");
  }

  const all: IngestedIssueDTO[] = [];
  let fetchedCount = 0;

  for (const label of GITHUB.allowedLabels) {
    for (let page = 1; page <= GITHUB.maxPagesPerLabel; page++) {
      const q = buildQuery({
        owner: params.owner,
        repo: params.repo,
        label,
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
        all.push(mapToDTO(it, params.owner, params.repo));
      }

      if (items.length < GITHUB.perPage) break;
    }
  }

  return { issues: all, fetchedCount };
}