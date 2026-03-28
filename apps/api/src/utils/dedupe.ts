export function issueKey(owner: string, repo: string, number: number) {
  return `${owner}/${repo}#${number}`;
}

export function dedupeByIssueKey<T extends { repoOwner: string; repoName: string; githubNumber: number }>(
  items: T[]
) {
  const seen = new Set<string>();
  const out: T[] = [];

  for (const it of items) {
    const key = issueKey(it.repoOwner, it.repoName, it.githubNumber);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(it);
    }
  }
  return out;
}