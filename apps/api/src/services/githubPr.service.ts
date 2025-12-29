import axios from "axios";

export type GitHubPull = {
  number: number;
  title: string;
  html_url: string;
  state: "open" | "closed";
  merged_at: string | null;
  closed_at: string | null;
};

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
    pulls.push({
      number: pr.number,
      title: pr.title,
      html_url: pr.html_url,
      state: pr.state,
      merged_at: pr.merged_at,
      closed_at: pr.closed_at
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