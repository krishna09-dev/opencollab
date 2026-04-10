import axios from "axios";

export type GitHubPull = {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: "open" | "closed";
  merged_at: string | null;
  closed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  additions: number;
  deletions: number;
  changed_files: number;
  comments: number;
  review_comments: number;
  requested_reviewers_count: number;
  review_state: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | null;
  language: string | null;
  author: string | null;
  participants: string[];
};

type GitHubReviewState = "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | null;

export type GitHubSidebarReviewerStatus = "approved" | "changes_requested" | "pending";

export type GitHubTimelineItem =
  | { type: "commit"; sha: string; message: string; author: string; committedAt: string }
  | { type: "comment"; id: string; login: string; body: string; createdAt: string; isReview: boolean }
  | { type: "review"; id: string; login: string; state: string; body: string; submittedAt: string };

export type GitHubPrSidebarData = {
  reviewers: Array<{ id: string; name: string; status: GitHubSidebarReviewerStatus }>;
  checks: Array<{ id: string; name: string; status: "success" | "running" | "failed"; durationLabel: string; progress: number }>;
  filesChangedTotal: number;
  filesChanged: Array<{ path: string; additions: number; deletions: number }>;
  additions: number;
  deletions: number;
  timelineItems: GitHubTimelineItem[];
  prHeadRef: string;
  prBaseRef: string;
  prLabels: string[];
};

/**
 * Parse a GitHub PR URL into owner, repo, and PR number
 * Supports formats:
 * - https://github.com/owner/repo/pull/123
 * - github.com/owner/repo/pull/123
 * - owner/repo#123
 * - owner/repo/123 (just numbers)
 */
export function parsePrUrl(input: string): { owner: string; repo: string; prNumber: number } | null {
  const trimmed = input.trim();

  // Try full URL format: https://github.com/owner/repo/pull/123
  const urlMatch = trimmed.match(/(?:https?:\/\/)?github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/i);
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2], prNumber: parseInt(urlMatch[3], 10) };
  }

  // Try owner/repo#123 format
  const hashMatch = trimmed.match(/^([^\/]+)\/([^#]+)#(\d+)$/);
  if (hashMatch) {
    return { owner: hashMatch[1], repo: hashMatch[2], prNumber: parseInt(hashMatch[3], 10) };
  }

  // Try owner/repo/123 format (just PR number at end)
  const slashMatch = trimmed.match(/^([^\/]+)\/([^\/]+)\/(\d+)$/);
  if (slashMatch) {
    return { owner: slashMatch[1], repo: slashMatch[2], prNumber: parseInt(slashMatch[3], 10) };
  }

  return null;
}

/**
 * Fetch participants (commenters, reviewers) of a PR
 */
async function fetchPrParticipants(params: {
  githubToken: string;
  owner: string;
  repo: string;
  prNumber: number;
}): Promise<string[]> {
  const { githubToken, owner, repo, prNumber } = params;
  const participants = new Set<string>();

  try {
    // Fetch reviewers
    const reviewsRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json"
        },
        params: { per_page: 100 }
      }
    );
    for (const review of reviewsRes.data || []) {
      if (review?.user?.login) participants.add(review.user.login);
    }

    // Fetch comments
    const commentsRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json"
        },
        params: { per_page: 100 }
      }
    );
    for (const comment of commentsRes.data || []) {
      if (comment?.user?.login) participants.add(comment.user.login);
    }

    // Fetch review comments (code comments)
    const reviewCommentsRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/comments`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json"
        },
        params: { per_page: 100 }
      }
    );
    for (const comment of reviewCommentsRes.data || []) {
      if (comment?.user?.login) participants.add(comment.user.login);
    }
  } catch {
    // Ignore errors fetching participants
  }

  return Array.from(participants);
}

/**
 * Fetch a single PR directly by owner, repo, and PR number
 */
export async function fetchPrByNumber(params: {
  githubToken: string;
  owner: string;
  repo: string;
  prNumber: number;
}): Promise<GitHubPull | null> {
  const { githubToken, owner, repo, prNumber } = params;
  const repoFullName = `${owner}/${repo}`;

  try {
    const prRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json"
        }
      }
    );

    const pr = prRes.data;
    const reviewState = await fetchLatestReviewState({
      githubToken,
      repoFullName,
      prNumber: pr.number
    });

    const participants = await fetchPrParticipants({ githubToken, owner, repo, prNumber });

    return {
      number: pr.number,
      title: pr.title,
      body: pr.body ?? null,
      html_url: pr.html_url,
      state: pr.state,
      merged_at: pr.merged_at,
      closed_at: pr.closed_at,
      created_at: pr.created_at ?? null,
      updated_at: pr.updated_at ?? null,
      additions: Number(pr.additions ?? 0),
      deletions: Number(pr.deletions ?? 0),
      changed_files: Number(pr.changed_files ?? 0),
      comments: Number(pr.comments ?? 0),
      review_comments: Number(pr.review_comments ?? 0),
      requested_reviewers_count: Array.isArray(pr.requested_reviewers) ? pr.requested_reviewers.length : 0,
      review_state: reviewState,
      language: pr?.base?.repo?.language ?? null,
      author: pr?.user?.login ?? null,
      participants
    };
  } catch (err: any) {
    if (err?.response?.status === 404) {
      return null;
    }
    throw err;
  }
}

async function fetchLatestReviewState(params: {
  githubToken: string;
  repoFullName: string;
  prNumber: number;
}): Promise<GitHubReviewState> {
  const { githubToken, repoFullName, prNumber } = params;
  const [owner, repo] = repoFullName.split("/");
  if (!owner || !repo) return null;

  try {
    const reviewsRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json"
        },
        params: { per_page: 100 }
      }
    );

    const reviews: any[] = Array.isArray(reviewsRes.data) ? reviewsRes.data : [];
    const relevant = reviews.filter((r) =>
      ["APPROVED", "CHANGES_REQUESTED", "COMMENTED"].includes(String(r?.state || ""))
    );
    if (!relevant.length) return null;

    relevant.sort((a, b) => {
      const aDate = new Date(a?.submitted_at || a?.updated_at || a?.created_at || 0).getTime();
      const bDate = new Date(b?.submitted_at || b?.updated_at || b?.created_at || 0).getTime();
      return aDate - bDate;
    });

    const state = String(relevant[relevant.length - 1]?.state || "");
    if (state === "APPROVED" || state === "CHANGES_REQUESTED" || state === "COMMENTED") {
      return state;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchPRsForIssue(params: {
  githubToken: string;
  repoFullName: string; // owner/repo
  issueNumber: number;
}): Promise<GitHubPull[]> {
  const { githubToken, repoFullName, issueNumber } = params;

  // GitHub REST: list PRs and filter by "linked issue" is not direct via REST.
  // Practical approach: search PRs mentioning/closing issue number via search API.
  // Query pattern: repo:owner/name is:pr (mentions issueNumber OR closes #issueNumber)
  const q = `repo:${repoFullName} is:pr (mentions:${issueNumber} OR "closes #${issueNumber}" OR "fixes #${issueNumber}" OR "resolves #${issueNumber}")`;

  const res = await axios.get("https://api.github.com/search/issues", {
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github+json"
    },
    params: { q, per_page: 10 }
  });

  // search/issues returns "issues" objects, PRs have pull_request url fields
  const items: any[] = res.data?.items ?? [];
  if (!items.length) return [];

  // Now fetch each PR detail (to know merged_at)
  const pulls: GitHubPull[] = [];
  for (const item of items) {
    if (!item.pull_request?.url) continue;

    const prRes = await axios.get(item.pull_request.url, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github+json"
      }
    });

    const pr = prRes.data;
    const reviewState = await fetchLatestReviewState({
      githubToken,
      repoFullName,
      prNumber: pr.number
    });

    const [owner, repo] = repoFullName.split("/");
    const participants = await fetchPrParticipants({ githubToken, owner, repo, prNumber: pr.number });

    pulls.push({
      number: pr.number,
      title: pr.title,
      body: pr.body ?? null,
      html_url: pr.html_url,
      state: pr.state,
      merged_at: pr.merged_at,
      closed_at: pr.closed_at,
      created_at: pr.created_at ?? null,
      updated_at: pr.updated_at ?? null,
      additions: Number(pr.additions ?? 0),
      deletions: Number(pr.deletions ?? 0),
      changed_files: Number(pr.changed_files ?? 0),
      comments: Number(pr.comments ?? 0),
      review_comments: Number(pr.review_comments ?? 0),
      requested_reviewers_count: Array.isArray(pr.requested_reviewers) ? pr.requested_reviewers.length : 0,
      review_state: reviewState,
      language: pr?.base?.repo?.language ?? null,
      author: pr?.user?.login ?? null,
      participants
    });
  }

  return pulls;
}

export function computeStatusFromPR(pr: { state?: string | null; merged_at?: string | null; closed_at?: string | null } | null) {
  // priority:
  // 1 MERGED
  // 2 CLOSED
  // 3 PR_OPEN
  // 4 ACCEPTED
  if (!pr) return "ACCEPTED" as const;
  if (pr.merged_at) return "MERGED" as const;
  if (pr.state === "closed") return "CLOSED" as const;
  if (pr.state === "open") return "PR_OPEN" as const;
  return "ACCEPTED" as const;
}

function formatDurationLabel(startedAt?: string | null, completedAt?: string | null): string {
  if (!startedAt || !completedAt) return "Completed";

  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return "Completed";

  const totalSeconds = Math.floor((end - start) / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

function mapReviewStateToSidebarStatus(state: string | null | undefined): GitHubSidebarReviewerStatus {
  if (state === "APPROVED") return "approved";
  if (state === "CHANGES_REQUESTED") return "changes_requested";
  return "pending";
}

function mapCheckRunToSidebarStatus(run: any): { status: "success" | "running" | "failed"; progress: number; durationLabel: string } {
  const rawStatus = String(run?.status || "").toLowerCase();
  const conclusion = String(run?.conclusion || "").toLowerCase();

  if (rawStatus !== "completed") {
    return {
      status: "running",
      progress: rawStatus === "in_progress" ? 65 : 20,
      durationLabel: rawStatus === "queued" ? "Queued" : "Running..."
    };
  }

  const succeeded = conclusion === "success" || conclusion === "neutral" || conclusion === "skipped";
  return {
    status: succeeded ? "success" : "failed",
    progress: 100,
    durationLabel: formatDurationLabel(run?.started_at ?? null, run?.completed_at ?? null)
  };
}

async function fetchPrFilesChanged(params: {
  githubToken: string;
  owner: string;
  repo: string;
  prNumber: number;
  maxPages?: number;
}): Promise<Array<{ path: string; additions: number; deletions: number }>> {
  const { githubToken, owner, repo, prNumber, maxPages = 3 } = params;
  const files: Array<{ path: string; additions: number; deletions: number }> = [];

  for (let page = 1; page <= maxPages; page++) {
    const res = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json"
        },
        params: { per_page: 100, page }
      }
    );

    const chunk: any[] = Array.isArray(res.data) ? res.data : [];
    for (const file of chunk) {
      files.push({
        path: String(file?.filename || ""),
        additions: Number(file?.additions ?? 0),
        deletions: Number(file?.deletions ?? 0)
      });
    }

    if (chunk.length < 100) break;
  }

  return files;
}

export async function fetchPrSidebarData(params: {
  githubToken: string;
  owner: string;
  repo: string;
  prNumber: number;
}): Promise<GitHubPrSidebarData> {
  const { githubToken, owner, repo, prNumber } = params;

  const prRes = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
    {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github+json"
      }
    }
  );

  const pr = prRes.data;
  const headSha = String(pr?.head?.sha || "").trim();
  const prHeadRef = String(pr?.head?.ref || "");
  const prBaseRef = String(pr?.base?.ref || "");
  const prLabels: string[] = Array.isArray(pr?.labels) ? pr.labels.map((l: any) => String(l?.name || "")).filter(Boolean) : [];

  const [reviewsRes, requestedReviewersRes, checksRes, filesChanged, commitsRes, issueCommentsRes] = await Promise.all([
    axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews`, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github+json"
      },
      params: { per_page: 100 }
    }),
    axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/requested_reviewers`, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github+json"
      }
    }),
    headSha
      ? axios.get(`https://api.github.com/repos/${owner}/${repo}/commits/${headSha}/check-runs`, {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json"
        },
        params: { per_page: 100 }
      }).catch(() => ({ data: { check_runs: [] } }))
      : Promise.resolve({ data: { check_runs: [] } }),
    fetchPrFilesChanged({ githubToken, owner, repo, prNumber }).catch(() => []),
    axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/commits`, {
      headers: { Authorization: `Bearer ${githubToken}`, Accept: "application/vnd.github+json" },
      params: { per_page: 100 }
    }).catch(() => ({ data: [] })),
    axios.get(`https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`, {
      headers: { Authorization: `Bearer ${githubToken}`, Accept: "application/vnd.github+json" },
      params: { per_page: 100 }
    }).catch(() => ({ data: [] }))
  ]);

  const reviewersByLogin = new Map<string, { status: GitHubSidebarReviewerStatus; at: number }>();
  const reviews: any[] = Array.isArray(reviewsRes.data) ? reviewsRes.data : [];

  for (const review of reviews) {
    const login = String(review?.user?.login || "").trim();
    if (!login) continue;

    const submittedAt = review?.submitted_at || review?.updated_at || review?.created_at;
    const at = submittedAt ? new Date(submittedAt).getTime() : 0;
    const status = mapReviewStateToSidebarStatus(String(review?.state || ""));

    const existing = reviewersByLogin.get(login);
    if (!existing || at >= existing.at) {
      reviewersByLogin.set(login, { status, at });
    }
  }

  const requestedUsers: any[] = Array.isArray(requestedReviewersRes.data?.users)
    ? requestedReviewersRes.data.users
    : [];

  for (const user of requestedUsers) {
    const login = String(user?.login || "").trim();
    if (!login) continue;
    if (!reviewersByLogin.has(login)) {
      reviewersByLogin.set(login, { status: "pending", at: Number.MAX_SAFE_INTEGER });
    }
  }

  const reviewers = Array.from(reviewersByLogin.entries())
    .map(([name, value]) => ({
      id: name,
      name,
      status: value.status
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const checkRuns: any[] = Array.isArray(checksRes.data?.check_runs) ? checksRes.data.check_runs : [];
  const checks = checkRuns.map((run) => {
    const mapped = mapCheckRunToSidebarStatus(run);
    return {
      id: String(run?.id ?? run?.name ?? Math.random()),
      name: String(run?.name || "Unnamed check"),
      status: mapped.status,
      durationLabel: mapped.durationLabel,
      progress: mapped.progress
    };
  });

  // Build timeline items
  const timelineItems: GitHubTimelineItem[] = [];

  // Commits
  const rawCommits: any[] = Array.isArray(commitsRes.data) ? commitsRes.data : [];
  for (const c of rawCommits) {
    timelineItems.push({
      type: "commit",
      sha: String(c?.sha || ""),
      message: String(c?.commit?.message || ""),
      author: String(c?.commit?.author?.name || c?.author?.login || ""),
      committedAt: String(c?.commit?.author?.date || c?.commit?.committer?.date || "")
    });
  }

  // Reviews (APPROVED / CHANGES_REQUESTED with optional body)
  for (const review of reviews) {
    const state = String(review?.state || "").toUpperCase();
    if (state !== "APPROVED" && state !== "CHANGES_REQUESTED") continue;
    const login = String(review?.user?.login || "").trim();
    if (!login) continue;
    timelineItems.push({
      type: "review",
      id: String(review?.id ?? Math.random()),
      login,
      state,
      body: String(review?.body || "").trim(),
      submittedAt: String(review?.submitted_at || "")
    });
  }

  // Issue comments (regular PR timeline comments)
  const rawIssueComments: any[] = Array.isArray(issueCommentsRes.data) ? issueCommentsRes.data : [];
  for (const c of rawIssueComments) {
    const login = String(c?.user?.login || "").trim();
    if (!login) continue;
    timelineItems.push({
      type: "comment",
      id: String(c?.id ?? Math.random()),
      login,
      body: String(c?.body || "").trim(),
      createdAt: String(c?.created_at || ""),
      isReview: false
    });
  }

  return {
    reviewers,
    checks,
    filesChangedTotal: Number(pr?.changed_files ?? filesChanged.length),
    filesChanged,
    additions: Number(pr?.additions ?? 0),
    deletions: Number(pr?.deletions ?? 0),
    timelineItems,
    prHeadRef,
    prBaseRef,
    prLabels
  };
}