import axios from "axios";
import mongoose from "mongoose";
import { User } from "../models/User";
import {
  Issue,
  type IssueDocument,
  type IssueStatus,
  type IssueUpdateItem,
  type SetupInstruction
} from "../models/Issue";
import { Notification } from "../models/Notification";

// ========== CONSTANTS ==========
const DEFAULT_OWNER = "GoogleCloudPlatform";
const DEFAULT_REPO = "agent-starter-pack";
const REFRESH_COOLDOWN_MS = 60 * 1000; // 1 minute
const DETAIL_AUTO_SYNC_STALE_MS = 60 * 1000; // 1 minute
const GITHUB_SYSTEM_TOKEN = process.env.GITHUB_SYSTEM_TOKEN;

type RepoMeta = {
  clone_url?: string;
  language?: string | null;
  default_branch?: string;
  open_issues_count?: number;
};

type RepoReadmeData = {
  text: string | null;
  htmlUrl: string;
};

// ========== HELPER FUNCTIONS ==========

export function ghHeaders(userToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "opencollab-app"
  };

  if (userToken) headers.Authorization = `Bearer ${userToken}`;
  else if (GITHUB_SYSTEM_TOKEN) headers.Authorization = `Bearer ${GITHUB_SYSTEM_TOKEN}`;

  return headers;
}

export function shortId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export async function notifyIssueWatchersIssueAvailable(issue: IssueDocument): Promise<number> {
  const watcherUserIds = Array.from(
    new Set((issue.notifyWatchers || []).map((id) => String(id || "").trim()).filter(Boolean))
  );

  if (watcherUserIds.length === 0) {
    issue.notifyWatchers = [];
    return 0;
  }

  const issueId = String(issue._id);
  await Notification.insertMany(
    watcherUserIds.map((watcherUserId) => ({
      userId: watcherUserId,
      type: "ISSUE_AVAILABLE",
      issueId,
      issueTitle: issue.title,
      message: `${issue.title} is available again`,
      read: false
    }))
  );

  issue.notifyWatchers = [];
  return watcherUserIds.length;
}

export function isBeginnerLabel(l: string) {
  const x = l.toLowerCase();
  return (
    x === "good first issue" ||
    x === "good-first-issue" ||
    x === "help wanted" ||
    x.includes("beginner") ||
    x.includes("easy") ||
    x.includes("starter") ||
    x.includes("first-timer") ||
    x.includes("documentation") ||
    x.includes("docs") ||
    x.includes("typo")
  );
}

function hasAdvancedLabel(l: string) {
  return /advanced|expert|complex|senior|hard|difficult|architecture|breaking|major|refactor|performance|security/i.test(l);
}

export function inferIssueDifficulty(issue: {
  beginnerFriendly?: boolean;
  labels?: string[];
  requiredSkills?: string[];
  body?: string;
  difficultyOverride?: "beginner" | "intermediate" | "advanced" | null;
}): "beginner" | "intermediate" | "advanced" {
  if (
    issue.difficultyOverride === "beginner" ||
    issue.difficultyOverride === "intermediate" ||
    issue.difficultyOverride === "advanced"
  ) {
    return issue.difficultyOverride;
  }

  const labels = (issue.labels || []).map((l) => String(l || "").toLowerCase());
  const hasBeginnerSignals = issue.beginnerFriendly || labels.some(isBeginnerLabel);
  const hasAdvancedSignals =
    labels.some(hasAdvancedLabel) ||
    (issue.requiredSkills || []).length > 5 ||
    String(issue.body || "").length > 2000;

  if (hasBeginnerSignals && !hasAdvancedSignals) return "beginner";
  if (hasAdvancedSignals && !hasBeginnerSignals) return "advanced";
  return "intermediate";
}

export async function getRepoMeta(owner: string, repo: string, userToken?: string) {
  const url = `https://api.github.com/repos/${owner}/${repo}`;
  const res = await axios.get(url, { headers: ghHeaders(userToken) });
  return res.data as RepoMeta;
}

export async function getRepoReadme(owner: string, repo: string, userToken?: string): Promise<RepoReadmeData> {
  const fallbackUrl = `https://github.com/${owner}/${repo}#readme`;

  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/readme`;
    const res = await axios.get(url, { headers: ghHeaders(userToken) });

    const data = res.data as { content?: string; encoding?: string; html_url?: string };

    if (typeof data?.content === "string" && data.content.trim()) {
      const decoded = data.encoding === "base64"
        ? Buffer.from(data.content, "base64").toString("utf8")
        : data.content;

      return {
        text: decoded,
        htmlUrl: data.html_url || fallbackUrl
      };
    }

    return { text: null, htmlUrl: data?.html_url || fallbackUrl };
  } catch (err) {
    if (!axios.isAxiosError(err) || err.response?.status !== 404) {
      console.warn(`Failed to fetch README for ${owner}/${repo}`, err);
    }
    return { text: null, htmlUrl: fallbackUrl };
  }
}

function normalizeShellCommand(line: string) {
  return line.replace(/^\s*(?:\$|>|PS [^>]*>)\s*/, "").trim();
}

function looksLikeShellCommand(line: string) {
  return /^(npm|pnpm|yarn|bun|npx|node|pip3?|python|poetry|uv|make|docker(?:-compose)?|go|cargo|mvn|gradle|dotnet|flutter|git)\b/i.test(line);
}

function isSetupHeading(value: string) {
  return /(install|setup|get started|quick start|run|running|development|local|usage|build|test)/i.test(value);
}

function extractSetupCommandsFromReadme(readmeText: string): SetupInstruction[] {
  type FenceBlock = { heading: string; lang: string; lines: string[] };

  const shellLangs = new Set(["", "bash", "sh", "shell", "zsh", "console", "cmd", "powershell", "pwsh"]);
  const blocks: FenceBlock[] = [];

  let heading = "";
  let inFence = false;
  let currentLang = "";
  let currentLines: string[] = [];

  for (const rawLine of readmeText.split(/\r?\n/)) {
    const headingMatch = rawLine.match(/^\s{0,3}#{1,6}\s+(.+)$/);
    const fenceMatch = rawLine.match(/^\s*```([\w-]*)\s*$/);

    if (!inFence && headingMatch) {
      heading = headingMatch[1].trim();
      continue;
    }

    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        currentLang = (fenceMatch[1] || "").toLowerCase();
        currentLines = [];
      } else {
        blocks.push({ heading, lang: currentLang, lines: currentLines });
        inFence = false;
        currentLang = "";
        currentLines = [];
      }
      continue;
    }

    if (inFence) currentLines.push(rawLine);
  }

  const pickCommands = (candidates: FenceBlock[]) => {
    const out: SetupInstruction[] = [];
    const seen = new Set<string>();

    for (const block of candidates) {
      if (!shellLangs.has(block.lang)) continue;

      for (const line of block.lines) {
        const command = normalizeShellCommand(line);
        if (!command || command.startsWith("#")) continue;
        if (!looksLikeShellCommand(command)) continue;
        if (seen.has(command)) continue;

        seen.add(command);
        const label = block.heading ? `README: ${block.heading}` : "README command";
        out.push({ label, command });

        if (out.length >= 8) return out;
      }
    }

    return out;
  };

  const setupBlocks = blocks.filter((b) => isSetupHeading(b.heading));
  const primary = pickCommands(setupBlocks);
  if (primary.length > 0) return primary;

  return pickCommands(blocks);
}

function buildProjectSetupNotes(readme: RepoReadmeData): string {
  if (!readme.text || !readme.text.trim()) {
    return `Project setup source: ${readme.htmlUrl}`;
  }

  const preview = readme.text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6)
    .join("\n");

  return (`Project setup source: ${readme.htmlUrl}\n\n${preview}`).slice(0, 1400);
}

async function hydrateIssueReadmeIfMissing(issue: IssueDocument, userToken?: string): Promise<IssueDocument> {
  if (issue.repositoryReadme && issue.repositoryReadmeUrl) {
    return issue;
  }

  try {
    const readme = await getRepoReadme(issue.repoOwner, issue.repoName, userToken);
    const nextReadme = readme.text || null;
    const nextReadmeUrl = readme.htmlUrl || `https://github.com/${issue.repoOwner}/${issue.repoName}#readme`;

    let changed = false;

    if (issue.repositoryReadme !== nextReadme) {
      issue.repositoryReadme = nextReadme;
      changed = true;
    }

    if (issue.repositoryReadmeUrl !== nextReadmeUrl) {
      issue.repositoryReadmeUrl = nextReadmeUrl;
      changed = true;
    }

    if (!issue.maintainerSetupNotes) {
      issue.maintainerSetupNotes = buildProjectSetupNotes(readme);
      changed = true;
    }

    if (!Array.isArray(issue.projectSetupCommands) || issue.projectSetupCommands.length === 0) {
      let repoMeta: RepoMeta = {};
      try {
        repoMeta = await getRepoMeta(issue.repoOwner, issue.repoName, userToken);
      } catch (err) {
        console.warn(`Failed to fetch repo meta while hydrating README for ${issue.repoOwner}/${issue.repoName}`, err);
      }

      issue.projectSetupCommands = buildProjectSetupCommands(repoMeta, readme);
      changed = true;
    }

    if (changed) {
      issue.lastSyncedAt = new Date();
      await issue.save();
    }
  } catch (err) {
    console.warn(`Failed to hydrate README for issue ${String(issue._id)}`, err);
  }

  return issue;
}

export function buildGitFlowCommands(owner: string, repo: string, issueNumber: number, repoMeta: RepoMeta) {
  const branch = `fix/issue-${issueNumber}`;
  const upstreamUrl = `https://github.com/${owner}/${repo}.git`;
  const defaultBranch = repoMeta?.default_branch || "main";

  return [
    { label: "Open issue", command: `Open https://github.com/${owner}/${repo}/issues/${issueNumber}` },
    { label: "Fork the repository", command: `Open https://github.com/${owner}/${repo} and click Fork` },
    { label: "Clone your fork", command: `git clone https://github.com/<your-username>/${repo}.git` },
    { label: "Enter project directory", command: `cd ${repo}` },
    { label: "Add upstream remote", command: `git remote add upstream ${upstreamUrl}` },
    { label: `Sync ${defaultBranch}`, command: `git fetch upstream && git checkout ${defaultBranch} && git pull upstream ${defaultBranch}` },
    { label: "Create issue branch", command: `git checkout -b ${branch}` },
    { label: "Stage and commit", command: `git add . && git commit -m \"fix: resolve #${issueNumber}\"` },
    { label: "Push branch", command: `git push -u origin ${branch}` },
    { label: "Open Pull Request", command: `Open GitHub and create a PR from ${branch} to ${owner}/${repo}:${defaultBranch}` }
  ];
}

export function buildProjectSetupCommands(repoMeta: RepoMeta, readme: RepoReadmeData) {
  const readmeEntry: SetupInstruction = {
    label: "Open repository README",
    command: readme.htmlUrl
  };

  const readmeCommands = readme.text ? extractSetupCommandsFromReadme(readme.text) : [];
  if (readmeCommands.length > 0) {
    return [readmeEntry, ...readmeCommands].slice(0, 10);
  }

  const lang = (repoMeta?.language || "").toLowerCase();

  if (["javascript", "typescript"].includes(lang)) {
    return [
      readmeEntry,
      { label: "Install dependencies", command: "npm install" },
      { label: "Run dev server", command: "npm run dev" },
      { label: "Run tests", command: "npm test" }
    ];
  }

  if (lang === "python") {
    return [
      readmeEntry,
      { label: "Create virtual environment", command: "python -m venv .venv" },
      { label: "Activate venv (mac/linux)", command: "source .venv/bin/activate" },
      { label: "Install dependencies", command: "pip install -r requirements.txt" },
      { label: "Run tests", command: "pytest -q" }
    ];
  }

  return [
    readmeEntry,
    { label: "Project setup", command: "See repository README for setup commands." }
  ];
}

export function buildRequiredSkills(labels: string[], repoLanguage: string | null) {
  const fromLabels = (labels || []).filter((l) => !isBeginnerLabel(l)).slice(0, 6);
  if (fromLabels.length) return fromLabels;

  const lang = (repoLanguage || "").toLowerCase();
  if (["javascript", "typescript"].includes(lang)) return ["JavaScript", "React", "Git", "Testing"];
  if (lang === "python") return ["Python", "Git", "Testing"];
  return ["Git", "Debugging", "Testing"];
}

export function buildExpectedOutcome(params: {
  labels: string[];
  repoLanguage: string | null;
  status: IssueStatus;
  issueNumber: number;
}) {
  const labels = (params.labels || []).map((l) => l.toLowerCase());
  const lang = (params.repoLanguage || "").toLowerCase();

  const isBug = labels.some((l) => l.includes("bug") || l.includes("error") || l.includes("crash"));
  const isDocs = labels.some((l) => l.includes("docs") || l.includes("documentation"));
  const isTest = labels.some((l) => l.includes("test") || l.includes("testing"));
  const isSecurity = labels.some((l) => l.includes("security") || l.includes("vuln"));
  const isRefactor = labels.some((l) => l.includes("refactor") || l.includes("cleanup"));
  const isFeature = labels.some((l) => l.includes("feature") || l.includes("enhancement") || l.includes("request"));

  const isNode = ["javascript", "typescript"].includes(lang);
  const isPython = ["python"].includes(lang);

  const out: string[] = [];
  if (params.status === "closed") out.push("Confirm the issue is resolved and document what changed.");

  if (isBug) {
    out.push("Reproduce the bug reliably and document steps + environment.");
    out.push("Fix the bug so runtime completes without errors.");
  } else if (isFeature) {
    out.push("Implement the feature and verify it meets acceptance criteria.");
  }

  if (isDocs) out.push("Update documentation so it matches actual behavior and commands.");
  if (isSecurity) out.push("Ensure the fix addresses the security concern without leaking sensitive info.");
  if (isRefactor) out.push("Refactor without changing behavior (validated via checks).");

  out.push(isTest ? "Add/Update tests that fail before and pass after." : "Add/Update tests if applicable.");

  if (isNode) out.push("Run `npm test` (and lint if used) and ensure CI would pass.");
  else if (isPython) out.push("Run `pytest` and ensure dependencies are correct.");
  else out.push("Run the project's build/test steps and confirm expected output.");

  out.push(`Open a PR referencing #${params.issueNumber} with clear verification steps.`);

  return Array.from(new Set(out)).slice(0, 8);
}

export function buildSuggestedResources(params: {
  labels: string[];
  body: string;
  repoLanguage: string | null;
}) {
  const labels = (params.labels || []).map((l) => l.toLowerCase());
  const body = (params.body || "").toLowerCase();
  const lang = (params.repoLanguage || "").toLowerCase();

  const isReact = labels.some((l) => l.includes("react")) || body.includes("react") || body.includes("suspense") || body.includes("hydration");
  const isNode = ["javascript", "typescript"].includes(lang);
  const isPython = lang === "python";

  if (isReact) {
    return [
      { title: "React 18 Suspense Docs", url: "https://react.dev/reference/react/Suspense", type: "react.dev/reference/react/Suspense" },
      { title: "SSR Hydration Guide", url: "https://react.dev/reference/react-dom/client/hydrateRoot", type: "react.dev/reference/react-dom/client/hydrateRoot" },
      { title: "Discussion: Concurrent Rendering", url: "https://github.com/reactwg/react-18/discussions", type: "Related concurrent mode issue" }
    ];
  }

  if (isNode) {
    return [
      { title: "GitHub Pull Request Guide", url: "https://docs.github.com/en/pull-requests", type: "docs.github.com" },
      { title: "Conventional Commits", url: "https://www.conventionalcommits.org/en/v1.0.0/", type: "conventionalcommits.org" },
      { title: "Writing Tests in JavaScript", url: "https://jestjs.io/docs/getting-started", type: "jestjs.io/docs" }
    ];
  }

  if (isPython) {
    return [
      { title: "Creating and Running Tests", url: "https://docs.pytest.org/en/stable/getting-started.html", type: "docs.pytest.org" },
      { title: "GitHub Pull Request Guide", url: "https://docs.github.com/en/pull-requests", type: "docs.github.com" },
      { title: "How to write a good commit message", url: "https://cbea.ms/git-commit/", type: "cbea.ms/git-commit" }
    ];
  }

  return [
    { title: "GitHub Pull Request Guide", url: "https://docs.github.com/en/pull-requests", type: "docs.github.com" },
    { title: "How to write a good commit message", url: "https://cbea.ms/git-commit/", type: "cbea.ms/git-commit" },
    { title: "Issue Triage Best Practices", url: "https://opensource.guide/best-practices/", type: "opensource.guide" }
  ];
}

function sameArray(a: any[], b: any[]) {
  return JSON.stringify(a ?? []) === JSON.stringify(b ?? []);
}

function isIssueSyncStale(lastSyncedAt?: Date | null): boolean {
  if (!lastSyncedAt) return true;
  const last = new Date(lastSyncedAt).getTime();
  if (!last || Number.isNaN(last)) return true;
  return Date.now() - last >= DETAIL_AUTO_SYNC_STALE_MS;
}

async function autoSyncIssueIfStale(
  issue: IssueDocument,
  userToken?: string
): Promise<{ issue: IssueDocument; synced: boolean }> {
  if (!isIssueSyncStale(issue.lastSyncedAt)) {
    return { issue, synced: false };
  }

  try {
    const synced = await syncIssueFromGitHub(issue.repoOwner, issue.repoName, issue.githubNumber, userToken);
    if (synced) {
      return { issue: synced, synced: true };
    }
  } catch (err) {
    console.warn(
      `Issue detail auto-sync failed for ${issue.repoOwner}/${issue.repoName}#${issue.githubNumber}`,
      err
    );
  }

  return { issue, synced: false };
}

function buildOpenedUpdate(ghIssue: any): IssueUpdateItem {
  return {
    id: `gh_opened_${String(ghIssue.id)}`,
    actorLogin: ghIssue.user?.login || "unknown",
    actorRole: ghIssue.author_association || null,
    body: "",
    createdAt: new Date(ghIssue.created_at)
  };
}

async function fetchAllIssueComments(
  owner: string,
  repo: string,
  githubNumber: number,
  userToken?: string
): Promise<any[]> {
  const perPage = 100;
  const maxPages = 100;
  const allComments: any[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const commentsUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${githubNumber}/comments`;
    const commentsRes = await axios.get(commentsUrl, {
      headers: ghHeaders(userToken),
      params: {
        per_page: perPage,
        page,
        sort: "created",
        direction: "asc"
      }
    });

    const pageComments: any[] = Array.isArray(commentsRes.data) ? commentsRes.data : [];
    if (pageComments.length === 0) break;

    allComments.push(...pageComments);

    const linkHeader = String(commentsRes.headers?.link || "");
    const hasNextPage = /rel="next"/.test(linkHeader);
    if (!hasNextPage) break;
  }

  const byId = new Map<string, any>();
  for (const comment of allComments) {
    const id = String(comment?.id || "").trim();
    if (!id) continue;
    byId.set(id, comment);
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

function mergeIssueUpdates(
  existing: IssueDocument | null,
  githubComments: any[],
  openedUpdate: IssueUpdateItem
): IssueUpdateItem[] {
  const existingUpdates = existing?.updates ?? [];

  // Keep non-comment events from local/OpenCollab history and deterministic GitHub system events
  // such as gh_opened_* and gh_closed_*.
  const persistentEvents = existingUpdates.filter((u) => {
    if (!u?.id) return false;
    if (u.id === openedUpdate.id) return false;

    if (u.id.startsWith("gh_")) {
      const isGithubComment = /^gh_\d+$/.test(u.id);
      return !isGithubComment;
    }

    return true;
  });

  // Always rebuild GitHub comments from the latest payload so edits/new comments stay in sync.
  const ghCommentUpdates: IssueUpdateItem[] = (githubComments || [])
    .filter((c) => typeof c?.body === "string" && c.body.trim().length > 0)
    .map((c) => ({
      id: `gh_${String(c.id)}`,
      actorLogin: c.user?.login || "unknown",
      actorRole: c.author_association || null,
      body: c.body,
      createdAt: new Date(c.created_at)
    }));

  const byId = new Map<string, IssueUpdateItem>();
  [openedUpdate, ...persistentEvents, ...ghCommentUpdates].forEach((update) => {
    byId.set(update.id, update);
  });

  const merged = Array.from(byId.values());
  merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return merged;
}

function ensureClosedIssueUpdate(
  updates: IssueUpdateItem[],
  ghIssue: any,
  ghUpdatedAt: Date
): IssueUpdateItem[] {
  const closedAt = ghIssue.closed_at ? new Date(ghIssue.closed_at) : ghUpdatedAt;
  const closedIdPrefix = `gh_closed_${String(ghIssue.id)}_`;
  const hasClosedEvent = (updates || []).some((u) => String(u?.id || "").startsWith(closedIdPrefix));

  if (hasClosedEvent) {
    return updates;
  }

  return [
    ...(updates || []),
    {
      id: `${closedIdPrefix}${closedAt.getTime()}`,
      actorLogin: ghIssue.closed_by?.login || ghIssue.user?.login || "unknown",
      actorRole: "GITHUB",
      body: "closed this issue",
      createdAt: closedAt
    }
  ];
}

export async function findIssueByParam(idParam: string): Promise<IssueDocument | null> {
  if (mongoose.isValidObjectId(idParam)) {
    return await Issue.findById(idParam);
  }

  const githubNumber = Number(idParam);
  if (!Number.isNaN(githubNumber)) {
    return await Issue.findOne({
      repoOwner: DEFAULT_OWNER,
      repoName: DEFAULT_REPO,
      githubNumber
    });
  }

  return null;
}

type GitHubIssueState = "open" | "closed";

function getGitHubApiErrorMessage(err: unknown): string | null {
  if (!axios.isAxiosError(err)) return null;
  const message = (err.response?.data as any)?.message;
  if (typeof message !== "string") return null;
  const trimmed = message.trim();
  return trimmed ? trimmed : null;
}

export async function syncGitHubIssueState(
  issue: Pick<IssueDocument, "repoOwner" | "repoName" | "githubNumber">,
  state: GitHubIssueState,
  userToken?: string
): Promise<void> {
  const tokens = [userToken, GITHUB_SYSTEM_TOKEN]
    .map((token) => String(token || "").trim())
    .filter(Boolean)
    .filter((token, index, arr) => arr.indexOf(token) === index);

  if (tokens.length === 0) {
    throw Object.assign(
      new Error("GitHub token is not configured for issue state sync."),
      { statusCode: 503 }
    );
  }

  const issueUrl = `https://api.github.com/repos/${issue.repoOwner}/${issue.repoName}/issues/${issue.githubNumber}`;

  let lastError: unknown = null;
  let lastStatusCode: number | undefined;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    try {
      await axios.patch(
        issueUrl,
        { state },
        { headers: ghHeaders(token) }
      );
      return;
    } catch (err) {
      const statusCode = axios.isAxiosError(err) ? err.response?.status : undefined;
      lastError = err;
      if (typeof statusCode === "number") {
        lastStatusCode = statusCode;
      }

      const hasFallbackToken = i < tokens.length - 1;
      const shouldTryFallback = hasFallbackToken && (statusCode === 401 || statusCode === 403 || statusCode === 404);
      if (shouldTryFallback) {
        continue;
      }

      break;
    }
  }

  const defaultMessage =
    state === "closed"
      ? "Failed to close this issue on GitHub."
      : "Failed to reopen this issue on GitHub.";
  const githubMessage = getGitHubApiErrorMessage(lastError);
  const message = githubMessage ? `${defaultMessage} ${githubMessage}` : defaultMessage;

  throw Object.assign(new Error(message), {
    statusCode: typeof lastStatusCode === "number" ? lastStatusCode : 502
  });
}

// ========== GITHUB SYNC ==========

export async function syncIssueFromGitHub(
  owner: string,
  repo: string,
  githubNumber: number,
  userToken?: string
): Promise<IssueDocument | null> {
  const existing = await Issue.findOne({ repoOwner: owner, repoName: repo, githubNumber });

  const issueUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${githubNumber}`;
  const ghRes = await axios.get(issueUrl, { headers: ghHeaders(userToken) });
  const ghIssue = ghRes.data;

  if (ghIssue.pull_request) return null;

  const openedUpdate = buildOpenedUpdate(ghIssue);
  const ghUpdatedAt = new Date(ghIssue.updated_at);

  const labels: string[] = Array.isArray(ghIssue.labels)
    ? ghIssue.labels.map((l: any) => l?.name).filter(Boolean)
    : [];

  const summary =
    typeof ghIssue.body === "string" && ghIssue.body.trim().length > 0
      ? ghIssue.body.slice(0, 240)
      : ghIssue.title;

  const status: IssueStatus = ghIssue.state === "open" ? "open" : "closed";
  const recentlyUpdated = Date.now() - ghUpdatedAt.getTime() < 1000 * 60 * 60 * 24 * 14;

  const comments = await fetchAllIssueComments(owner, repo, githubNumber, userToken);

  const repoMeta = await getRepoMeta(owner, repo, userToken);
  const repoReadme = await getRepoReadme(owner, repo, userToken);

  const requiredSkills = buildRequiredSkills(labels, repoMeta?.language || null);
  const expectedOutcome = buildExpectedOutcome({
    labels,
    repoLanguage: repoMeta?.language || null,
    status,
    issueNumber: githubNumber
  });

  const gitFlowCommands = buildGitFlowCommands(owner, repo, githubNumber, repoMeta);
  const projectSetupCommands = buildProjectSetupCommands(repoMeta, repoReadme);
  const maintainerSetupNotes = buildProjectSetupNotes(repoReadme);
  const repositoryReadme = repoReadme.text || null;
  const repositoryReadmeUrl = repoReadme.htmlUrl || null;

  const suggestedResources = buildSuggestedResources({
    labels,
    body: ghIssue.body || "",
    repoLanguage: repoMeta?.language || null
  });

  const baseData = {
    githubNumber,
    repoOwner: owner,
    repoName: repo,
    repoLanguage: repoMeta?.language || null,
    title: ghIssue.title,
    body: ghIssue.body || "",
    summary,
    labels,
    githubUrl: ghIssue.html_url,
    githubCreatedAt: new Date(ghIssue.created_at),
    githubUpdatedAt: ghUpdatedAt,
    openedAt: new Date(ghIssue.created_at),
    recentlyUpdated
  };

  const beginnerFriendly = labels.some(isBeginnerLabel);

  if (existing && existing.githubUpdatedAt?.getTime() === ghUpdatedAt.getTime()) {
    let mergedUpdates = mergeIssueUpdates(existing, comments, openedUpdate);

    if (status === "closed") {
      mergedUpdates = ensureClosedIssueUpdate(mergedUpdates, ghIssue, ghUpdatedAt);
    }

    const shouldMarkClosed = status === "closed" && existing.status !== "closed";
    const shouldReopen = status === "open" && existing.status === "closed";

    const needSave =
      existing.repoLanguage !== baseData.repoLanguage ||
      !sameArray(existing.requiredSkills, requiredSkills) ||
      !sameArray(existing.expectedOutcome, expectedOutcome) ||
      !sameArray(existing.autoSetupCommands, gitFlowCommands) ||
      !sameArray((existing as any).projectSetupCommands || [], projectSetupCommands) ||
      existing.maintainerSetupNotes !== maintainerSetupNotes ||
      existing.repositoryReadme !== repositoryReadme ||
      existing.repositoryReadmeUrl !== repositoryReadmeUrl ||
      !sameArray(existing.updates, mergedUpdates) ||
      shouldMarkClosed ||
      shouldReopen;

    if (needSave) {
      existing.repoLanguage = baseData.repoLanguage;
      existing.requiredSkills = requiredSkills;
      existing.expectedOutcome = expectedOutcome;
      existing.autoSetupCommands = gitFlowCommands;
      (existing as any).projectSetupCommands = projectSetupCommands;
      existing.maintainerSetupNotes = maintainerSetupNotes;
      existing.repositoryReadme = repositoryReadme;
      existing.repositoryReadmeUrl = repositoryReadmeUrl;
      existing.suggestedResources = suggestedResources;
      existing.updates = mergedUpdates;

      if (shouldMarkClosed) {
        existing.status = "closed";
      } else if (shouldReopen) {
        existing.status = existing.claimedByUserId ? "claimed" : "open";
      }
    }

    existing.lastSyncedAt = new Date();
    await existing.save();
    return existing;
  }

  if (!existing) {
    const created = await Issue.create({
      ...baseData,
      status,
      lastSyncedAt: new Date(),

      repoHealth: {
        healthScore: 85,
        activityScore: 80,
        openIssues: repoMeta?.open_issues_count ?? 0,
        recentCommits: 0
      },

      beginnerFriendly,
      activeMaintainer: true,

      requiredSkills,
      expectedOutcome,
      suggestedResources,

      autoSetupCommands: gitFlowCommands,
      projectSetupCommands,
      maintainerSetupNotes,
      repositoryReadme,
      repositoryReadmeUrl,

      prStatus: "NONE",
      notifyWatchers: [],

      updates: mergeIssueUpdates(null, comments, openedUpdate),
      contributionTimeline: []
    });

    return created;
  }

  existing.repoLanguage = baseData.repoLanguage;
  existing.title = baseData.title;
  existing.body = baseData.body;
  existing.summary = baseData.summary;
  existing.labels = baseData.labels;
  existing.githubUrl = baseData.githubUrl;
  existing.githubCreatedAt = baseData.githubCreatedAt;
  existing.githubUpdatedAt = baseData.githubUpdatedAt;
  existing.openedAt = baseData.openedAt;
  existing.recentlyUpdated = baseData.recentlyUpdated;

  existing.beginnerFriendly = beginnerFriendly;
  existing.requiredSkills = requiredSkills;
  existing.expectedOutcome = expectedOutcome;
  existing.suggestedResources = suggestedResources;

  existing.autoSetupCommands = gitFlowCommands;
  (existing as any).projectSetupCommands = projectSetupCommands;
  existing.maintainerSetupNotes = maintainerSetupNotes;
  existing.repositoryReadme = repositoryReadme;
  existing.repositoryReadmeUrl = repositoryReadmeUrl;

  existing.updates = mergeIssueUpdates(existing, comments, openedUpdate);

  if (status === "closed") {
    existing.updates = ensureClosedIssueUpdate(existing.updates || [], ghIssue, ghUpdatedAt);
    // Keep claimant metadata so closed issues can still show submit-PR context.
    existing.status = "closed";
  } else if (existing.status === "closed") {
    existing.status = existing.claimedByUserId ? "claimed" : "open";
  }

  existing.lastSyncedAt = new Date();
  await existing.save();
  return existing;
}

// ========== SERVICE CLASS ==========

export class IssuesService {
  private readonly REFRESH_COOLDOWN_MS = REFRESH_COOLDOWN_MS;

  async getStats(): Promise<{ total: number; open: number; beginner: number }> {
    const total = await Issue.countDocuments({});
    const open = await Issue.countDocuments({ status: "open" });
    const beginner = await Issue.countDocuments({ beginnerFriendly: true });
    return { total, open, beginner };
  }

  async getAvailableLanguages(): Promise<string[]> {
    const raw = await Issue.distinct("repoLanguage", {
      isApproved: true,
      isVisible: true,
      repoLanguage: { $nin: [null, ""] }
    });

    const normalized = (raw as Array<string | null | undefined>)
      .map((x) => String(x || "").trim())
      .filter(Boolean);

    const seen = new Set<string>();
    const unique: string[] = [];

    for (const lang of normalized) {
      const key = lang.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(lang);
    }

    return unique.sort((a, b) => a.localeCompare(b));
  }

  async listIssues(params: {
    page: number;
    limit: number;
    status?: string;
    language?: string;
    difficulty?: string;
    search?: string;
    sort?: string;
  }): Promise<{ issues: IssueDocument[]; pagination: object }> {
    const { page, limit, status, language, difficulty, search, sort } = params;

    const pageNum = Math.max(1, page);
    const limitNum = Math.min(50, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, any> = {
      isApproved: true,
      isVisible: true
    };

    if (status && ["open", "claimed", "closed"].includes(status)) {
      filter.status = status;
    }

    if (language) {
      const langs = language.split(",").map((l) => l.trim()).filter(Boolean);
      if (langs.length > 0) {
        filter.$and = [
          ...(filter.$and || []),
          {
            $or: langs.flatMap((l) => [
              { repoLanguage: { $regex: new RegExp(`^${l}$`, "i") } },
              { labels: { $regex: new RegExp(l, "i") } },
              { requiredSkills: { $regex: new RegExp(l, "i") } }
            ])
          }
        ];
      }
    }

    const beginnerRegex = /good first issue|good-first-issue|help wanted|beginner|easy|starter|first-timer|documentation|docs|typo/i;
    const advancedRegex = /advanced|expert|complex|senior|hard|difficult|architecture|breaking|major|refactor|performance|security/i;
    const advancedSignals = [
      { labels: { $regex: advancedRegex } },
      { "requiredSkills.5": { $exists: true } },
      {
        $expr: {
          $gt: [{ $strLenCP: { $ifNull: ["$body", ""] } }, 2000]
        }
      }
    ];

    const beginnerSignals = [
      { beginnerFriendly: true },
      { labels: { $regex: beginnerRegex } }
    ];

    const noDifficultyOverride = {
      $or: [{ difficultyOverride: { $exists: false } }, { difficultyOverride: null }]
    };

    let autoDifficultyFilter: Record<string, any> | null = null;

    if (difficulty === "beginner") {
      autoDifficultyFilter = {
        $and: [{ $or: beginnerSignals }, { $nor: advancedSignals }]
      };
    } else if (difficulty === "intermediate") {
      autoDifficultyFilter = {
        $or: [
          {
            $and: [{ $nor: beginnerSignals }, { $nor: advancedSignals }]
          },
          {
            $and: [{ $or: beginnerSignals }, { $or: advancedSignals }]
          }
        ]
      };
    } else if (difficulty === "advanced") {
      autoDifficultyFilter = {
        $and: [{ $or: advancedSignals }, { $nor: beginnerSignals }]
      };
    }

    if (difficulty && autoDifficultyFilter) {
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { difficultyOverride: difficulty },
            {
              $and: [noDifficultyOverride, autoDifficultyFilter]
            }
          ]
        }
      ];
    }

    if (search && search.trim()) {
      const s = search.trim();
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { title: { $regex: new RegExp(s, "i") } },
            { repoName: { $regex: new RegExp(s, "i") } },
            { repoOwner: { $regex: new RegExp(s, "i") } },
            { summary: { $regex: new RegExp(s, "i") } }
          ]
        }
      ];
    }

    let sortObj: Record<string, 1 | -1> = { githubUpdatedAt: -1 };
    if (sort === "oldest") sortObj = { githubUpdatedAt: 1 };
    else if (sort === "recently-created") sortObj = { githubCreatedAt: -1 };

    // When no explicit status filter is requested, keep claimed issues at the end.
    if (!status) {
      sortObj = { status: -1, ...sortObj };
    }

    const [issues, total] = await Promise.all([
      Issue.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .select(
          "_id githubNumber repoOwner repoName repoLanguage title body summary status labels " +
          "requiredSkills beginnerFriendly difficultyOverride githubCreatedAt githubUpdatedAt " +
          "claimedByLogin githubUrl updates"
        ),
      Issue.countDocuments(filter)
    ]);

    const issuesWithCounts = issues.map((issue) => {
      const obj: any = issue.toObject();
      obj.commentsCount = (obj.updates || []).filter(
        (u: any) => u.id && u.id.startsWith("gh_")
      ).length;
      obj.difficulty = inferIssueDifficulty(obj);
      delete obj.updates;
      return obj;
    });

    return {
      issues: issuesWithCounts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  async getIssueById(idParam: string, userId?: string): Promise<{ issue: IssueDocument | null; synced?: boolean }> {
    const user = userId ? await User.findById(userId).select("githubAccessToken") : null;
    const userToken = user?.githubAccessToken || undefined;
    const githubNumber = Number(idParam);

    if (!Number.isNaN(githubNumber)) {
      const fromDb = await Issue.findOne({
        repoOwner: DEFAULT_OWNER,
        repoName: DEFAULT_REPO,
        githubNumber
      });
      if (fromDb) {
        const hydrated = await hydrateIssueReadmeIfMissing(fromDb, userToken);
        const syncedResult = await autoSyncIssueIfStale(hydrated, userToken);
        return { issue: syncedResult.issue, synced: syncedResult.synced || undefined };
      }

      const issue = await syncIssueFromGitHub(DEFAULT_OWNER, DEFAULT_REPO, githubNumber, userToken);
      return { issue, synced: true };
    }

    if (!mongoose.isValidObjectId(idParam)) {
      return { issue: null };
    }

    const issueById = await Issue.findById(idParam);
    if (!issueById) return { issue: null };

    const hydrated = await hydrateIssueReadmeIfMissing(issueById, userToken);
    const syncedResult = await autoSyncIssueIfStale(hydrated, userToken);
    return { issue: syncedResult.issue, synced: syncedResult.synced || undefined };
  }

  async refreshIssue(idParam: string, userId: string): Promise<{
    success: boolean;
    issue?: IssueDocument;
    error?: string;
    retryAfterSec?: number;
  }> {
    const issue = await findIssueByParam(idParam);
    if (!issue) return { success: false, error: "Issue not found" };

    const last = issue.lastSyncedAt ? new Date(issue.lastSyncedAt).getTime() : 0;
    const now = Date.now();

    if (last && now - last < this.REFRESH_COOLDOWN_MS) {
      const cooldownMinutes = Math.round(this.REFRESH_COOLDOWN_MS / (60 * 1000));
      const cooldownLabel = cooldownMinutes === 1 ? "1 minute" : `${cooldownMinutes} minutes`;
      return {
        success: false,
        error: `Refresh allowed once every ${cooldownLabel}`,
        retryAfterSec: Math.ceil((this.REFRESH_COOLDOWN_MS - (now - last)) / 1000)
      };
    }

    const user = await User.findById(userId).select("githubAccessToken");
    const userToken = user?.githubAccessToken || undefined;

    const refreshed = await syncIssueFromGitHub(
      issue.repoOwner,
      issue.repoName,
      issue.githubNumber,
      userToken
    );

    if (!refreshed) return { success: false, error: "Issue not found" };
    return { success: true, issue: refreshed };
  }

  async claimIssue(idParam: string, userId: string): Promise<{
    success: boolean;
    status: number;
    data: object;
  }> {
    const issue = await findIssueByParam(idParam);
    if (!issue) return { success: false, status: 404, data: { message: "Issue not found" } };
    if (issue.status === "closed") return { success: false, status: 400, data: { message: "Issue is closed." } };

    const user = await User.findById(userId).select("login");
    if (!user) return { success: false, status: 404, data: { message: "User not found" } };

    const displayName = user.login || userId;

    if (issue.status === "claimed" && issue.claimedByUserId !== userId) {
      return {
        success: false,
        status: 409,
        data: { message: "Issue has already been claimed by another user." }
      };
    }
    if (issue.status === "claimed" && issue.claimedByUserId === userId) {
      return { success: true, status: 200, data: { message: "Issue already claimed by this user.", issue } };
    }

    const now = new Date();
    const claimedIssue = await Issue.findOneAndUpdate(
      {
        _id: issue._id,
        status: "open"
      },
      {
        $set: {
          status: "claimed",
          claimedByUserId: userId,
          claimedByLogin: displayName,
          claimedAt: now,
          contributionTimeline: [
            {
              id: shortId("tl"),
              title: "Issue accepted in OpenCollab",
              status: "ACCEPTED",
              at: now,
              meta: null
            }
          ]
        },
        $push: {
          updates: {
            id: shortId("claim"),
            actorLogin: displayName,
            actorRole: "OPENCOLLAB",
            body: `${displayName} claimed this issue`,
            createdAt: now
          }
        }
      },
      { new: true }
    );

    if (!claimedIssue) {
      const latestIssue = await Issue.findById(issue._id);
      if (!latestIssue) {
        return { success: false, status: 404, data: { message: "Issue not found" } };
      }
      if (latestIssue.status === "closed") {
        return { success: false, status: 400, data: { message: "Issue is closed." } };
      }
      if (latestIssue.status === "claimed" && latestIssue.claimedByUserId === userId) {
        return {
          success: true,
          status: 200,
          data: { message: "Issue already claimed by this user.", issue: latestIssue }
        };
      }

      return {
        success: false,
        status: 409,
        data: { message: "Issue has already been claimed by another user." }
      };
    }

    return {
      success: true,
      status: 200,
      data: {
        message: "Issue successfully claimed.",
        issue: claimedIssue
      }
    };
  }

  async abortIssue(idParam: string, userId: string): Promise<{
    success: boolean;
    status: number;
    data: object;
  }> {
    const issue = await findIssueByParam(idParam);
    if (!issue) return { success: false, status: 404, data: { message: "Issue not found" } };

    if (issue.status !== "claimed" || !issue.claimedByUserId) {
      return { success: false, status: 400, data: { message: "Issue is not currently claimed." } };
    }

    if (issue.claimedByUserId !== userId) {
      return { success: false, status: 403, data: { message: "You cannot abort an issue claimed by someone else." } };
    }

    const who = issue.claimedByLogin || "unknown";

    issue.status = "open";
    issue.claimedByUserId = null;
    issue.claimedByLogin = null;
    issue.claimedAt = null;

    issue.contributionTimeline = [];

    issue.updates.push({
      id: shortId("abort"),
      actorLogin: who,
      actorRole: "OPENCOLLAB",
      body: `${who} aborted this issue`,
      createdAt: new Date()
    });

    await notifyIssueWatchersIssueAvailable(issue);
    await issue.save();

    return {
      success: true,
      status: 200,
      data: {
        message: "Issue successfully aborted.",
        issue
      }
    };
  }

  async notifyOnIssue(idParam: string, userId: string): Promise<{
    success: boolean;
    status: number;
    data: object;
  }> {
    const issue = await findIssueByParam(idParam);
    if (!issue) return { success: false, status: 404, data: { message: "Issue not found" } };

    if (issue.status === "open") {
      return { success: false, status: 400, data: { message: "Issue is already open – you can claim it now." } };
    }

    if (!issue.notifyWatchers.includes(userId)) {
      issue.notifyWatchers.push(userId);
      await issue.save();
    }

    return {
      success: true,
      status: 200,
      data: { message: "You will be notified when this issue becomes available.", issue }
    };
  }
}

export const issuesService = new IssuesService();
