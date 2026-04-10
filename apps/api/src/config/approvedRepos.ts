export type ApprovedRepoConfig = {
  owner: string;
  repo: string;
  isActive?: boolean;
};

// Keep this list empty unless you intentionally want repos auto-seeded at startup.
export const APPROVED_REPOS: ApprovedRepoConfig[] = [];

export const toFullName = (owner: string, repo: string) => `${owner}/${repo}`;

export const isSystemApprovedRepo = (fullName: string) =>
  APPROVED_REPOS.some((repo) => toFullName(repo.owner, repo.repo) === fullName);