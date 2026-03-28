import axios from "axios";

export type GitHubPull = {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: "open" | "closed";
  merged_at: string | null;
  closed_at: string | null;
  updated_at: string | null;
  comments: number;
  review_comments: number;
  requested_reviewers_count: number;
  review_state: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | null;
  language: string | null;
};

type GitHubReviewState = "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | null;

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

    pulls.push({
      number: pr.number,
      title: pr.title,
      body: pr.body ?? null,
      html_url: pr.html_url,
      state: pr.state,
      merged_at: pr.merged_at,
      closed_at: pr.closed_at,
      updated_at: pr.updated_at ?? null,
      comments: Number(pr.comments ?? 0),
      review_comments: Number(pr.review_comments ?? 0),
      requested_reviewers_count: Array.isArray(pr.requested_reviewers) ? pr.requested_reviewers.length : 0,
      review_state: reviewState,
      language: pr?.base?.repo?.language ?? null
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