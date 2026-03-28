import axios from "axios";
import mongoose from "mongoose";
import { User } from "../models/User";
import {
  Issue,
  type IssueDocument,
  type IssueStatus,
  type IssueUpdateItem
} from "../models/Issue";
import { notifications, type NotificationDto } from "../routes/notifications.routes";

// ========== CONSTANTS ==========
const DEFAULT_OWNER = "GoogleCloudPlatform";
const DEFAULT_REPO = "agent-starter-pack";
const REFRESH_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes
const GITHUB_SYSTEM_TOKEN = process.env.GITHUB_SYSTEM_TOKEN;

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

export function isBeginnerLabel(l: string) {
  const x = l.toLowerCase();
  return x === "good first issue" || x === "good-first-issue" || x.includes("beginner");
}

export async function getRepoMeta(owner: string, repo: string, userToken?: string) {
  const url = `https://api.github.com/repos/${owner}/${repo}`;
  const res = await axios.get(url, { headers: ghHeaders(userToken) });
  return res.data as {
    clone_url: string;
    language: string | null;
    default_branch: string;
    open_issues_count: number;
  };
}

export function buildGitFlowCommands(owner: string, repo: string, issueNumber: number, repoMeta: any) {
  const branch = `fix/issue-${issueNumber}`;
  const cloneUrl = repoMeta?.clone_url || `https://github.com/${owner}/${repo}.git`;

  return [
    { label: "Fork the repository", command: `Open https://github.com/${owner}/${repo} and click Fork` },
    { label: "Clone the forked repository", command: `git clone ${cloneUrl}` },
    { label: "Enter project directory", command: `cd ${repo}` },
    { label: "Create a new branch", command: `git checkout -b ${branch}` },
    { label: "Check current branch", command: `git branch` },
    { label: "Stage changes", command: `git add .` },
    { label: "Commit changes", command: `git commit -m "Fix #${issueNumber}"` },
    { label: "Push branch", command: `git push -u origin ${branch}` },
    { label: "Open Pull Request", command: `Open GitHub → Compare & pull request → mention #${issueNumber}` }
  ];
}

export function buildProjectSetupCommands(repoMeta: any) {
  const lang = (repoMeta?.language || "").toLowerCase();

  if (["javascript", "typescript"].includes(lang)) {
    return [
      { label: "Install dependencies", command: "npm install" },
      { label: "Run dev server", command: "npm run dev" },
      { label: "Run tests", command: "npm test" }
    ];
  }

  if (lang === "python") {
    return [
      { label: "Create virtual environment", command: "python -m venv .venv" },
      { label: "Activate venv (mac/linux)", command: "source .venv/bin/activate" },
      { label: "Install dependencies", command: "pip install -r requirements.txt" },
      { label: "Run tests", command: "pytest -q" }
    ];
  }

  return [{ label: "Project setup", command: "See repository README for setup commands." }];
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

function buildOpenedUpdate(ghIssue: any): IssueUpdateItem {
  return {
    id: `gh_opened_${String(ghIssue.id)}`,
    actorLogin: ghIssue.user?.login || "unknown",
    actorRole: ghIssue.author_association || null,
    body: "",
    createdAt: new Date(ghIssue.created_at)
  };
}

function mergeIssueUpdates(
  existing: IssueDocument | null,
  githubComments: any[],
  openedUpdate: IssueUpdateItem
): IssueUpdateItem[] {
  const existingUpdates = existing?.updates ?? [];
  const existingIds = new Set(existingUpdates.map((u) => u.id));

  const openCollabEvents = existingUpdates.filter((u) => !u.id.startsWith("gh_"));

  const ghCommentUpdates: IssueUpdateItem[] = (githubComments || [])
    .filter((c) => typeof c?.body === "string" && c.body.trim().length > 0)
    .map((c) => ({
      id: `gh_${String(c.id)}`,
      actorLogin: c.user?.login || "unknown",
      actorRole: c.author_association || null,
      body: c.body,
      createdAt: new Date(c.created_at)
    }))
    .filter((u) => !existingIds.has(u.id));

  const merged = [
    openedUpdate,
    ...openCollabEvents.filter((u) => u.id !== openedUpdate.id),
    ...ghCommentUpdates
  ];

  merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return merged;
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

  const commentsUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${githubNumber}/comments?per_page=50`;
  const commentsRes = await axios.get(commentsUrl, { headers: ghHeaders(userToken) });
  const comments: any[] = Array.isArray(commentsRes.data) ? commentsRes.data : [];

  const repoMeta = await getRepoMeta(owner, repo, userToken);

  const requiredSkills = buildRequiredSkills(labels, repoMeta?.language || null);
  const expectedOutcome = buildExpectedOutcome({
    labels,
    repoLanguage: repoMeta?.language || null,
    status,
    issueNumber: githubNumber
  });

  const gitFlowCommands = buildGitFlowCommands(owner, repo, githubNumber, repoMeta);
  const projectSetupCommands = buildProjectSetupCommands(repoMeta);

  const suggestedResources = buildSuggestedResources({
    labels,
    body: ghIssue.body || "",
    repoLanguage: repoMeta?.language || null
  });

  const baseData = {
    githubNumber,
    repoOwner: owner,
    repoName: repo,
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
    const mergedUpdates = mergeIssueUpdates(existing, comments, openedUpdate);

    const needSave =
      !sameArray(existing.requiredSkills, requiredSkills) ||
      !sameArray(existing.expectedOutcome, expectedOutcome) ||
      !sameArray(existing.autoSetupCommands, gitFlowCommands) ||
      !sameArray((existing as any).projectSetupCommands || [], projectSetupCommands) ||
      !sameArray(existing.updates, mergedUpdates);

    if (needSave) {
      existing.requiredSkills = requiredSkills;
      existing.expectedOutcome = expectedOutcome;
      existing.autoSetupCommands = gitFlowCommands;
      (existing as any).projectSetupCommands = projectSetupCommands;
      existing.suggestedResources = suggestedResources;
      existing.updates = mergedUpdates;
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

      prStatus: "NONE",
      notifyWatchers: [],

      updates: mergeIssueUpdates(null, comments, openedUpdate),
      contributionTimeline: []
    });

    return created;
  }

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

  existing.updates = mergeIssueUpdates(existing, comments, openedUpdate);

  if (status === "closed") existing.status = "closed";

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

    const filter: Record<string, any> = {};

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
              { labels: { $regex: new RegExp(l, "i") } },
              { requiredSkills: { $regex: new RegExp(l, "i") } }
            ])
          }
        ];
      }
    }

    if (difficulty === "beginner") {
      filter.beginnerFriendly = true;
    } else if (difficulty === "intermediate") {
      // Intermediate: not beginner-friendly and no advanced/expert labels
      filter.beginnerFriendly = { $ne: true };
      const advancedPatterns = ["advanced", "expert", "complex", "senior", "hard", "difficult"];
      filter.$and = [
        ...(filter.$and || []),
        {
          $nor: advancedPatterns.map((p) => ({
            labels: { $regex: new RegExp(p, "i") }
          }))
        }
      ];
    } else if (difficulty === "advanced") {
      // Advanced: not beginner-friendly and has advanced/expert/complex labels OR many required skills
      filter.beginnerFriendly = { $ne: true };
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { labels: { $regex: /advanced|expert|complex|senior|hard|difficult/i } },
            { "requiredSkills.5": { $exists: true } }
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

    const [issues, total] = await Promise.all([
      Issue.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .select(
          "_id githubNumber repoOwner repoName title body summary status labels " +
          "requiredSkills beginnerFriendly githubCreatedAt githubUpdatedAt " +
          "claimedByLogin githubUrl updates"
        ),
      Issue.countDocuments(filter)
    ]);

    const issuesWithCounts = issues.map((issue) => {
      const obj: any = issue.toObject();
      obj.commentsCount = (obj.updates || []).filter(
        (u: any) => u.id && u.id.startsWith("gh_")
      ).length;
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
    const githubNumber = Number(idParam);

    if (!Number.isNaN(githubNumber)) {
      const fromDb = await Issue.findOne({
        repoOwner: DEFAULT_OWNER,
        repoName: DEFAULT_REPO,
        githubNumber
      });
      if (fromDb) return { issue: fromDb };

      const user = userId ? await User.findById(userId).select("githubAccessToken") : null;
      const userToken = user?.githubAccessToken || undefined;

      const issue = await syncIssueFromGitHub(DEFAULT_OWNER, DEFAULT_REPO, githubNumber, userToken);
      return { issue, synced: true };
    }

    if (!mongoose.isValidObjectId(idParam)) {
      return { issue: null };
    }

    const issueById = await Issue.findById(idParam);
    return { issue: issueById };
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
      return {
        success: false,
        error: "Refresh allowed once every 10 minutes",
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
      return { success: false, status: 403, data: { message: `Issue already claimed by ${issue.claimedByLogin}.` } };
    }
    if (issue.status === "claimed" && issue.claimedByUserId === userId) {
      return { success: true, status: 200, data: { message: "Issue already claimed by this user.", issue } };
    }

    issue.status = "claimed";
    issue.claimedByUserId = userId;
    issue.claimedByLogin = displayName;
    issue.claimedAt = new Date();

    issue.contributionTimeline = [
      {
        id: shortId("tl"),
        title: "Issue accepted in OpenCollab",
        status: "ACCEPTED",
        at: new Date(),
        meta: null
      }
    ];

    issue.updates.push({
      id: shortId("claim"),
      actorLogin: displayName,
      actorRole: "OPENCOLLAB",
      body: `${displayName} claimed this issue`,
      createdAt: new Date()
    });

    await issue.save();
    return { success: true, status: 200, data: { message: "Issue successfully claimed.", issue } };
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

    const now = new Date().toISOString();
    issue.notifyWatchers.forEach((watcherUserId) => {
      const notification: NotificationDto = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        userId: watcherUserId,
        type: "ISSUE_AVAILABLE",
        issueId: String(issue.githubNumber),
        issueTitle: issue.title,
        createdAt: now,
        read: false
      };
      notifications.push(notification);
    });

    issue.notifyWatchers = [];
    await issue.save();

    return { success: true, status: 200, data: { message: "Issue successfully aborted.", issue } };
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
