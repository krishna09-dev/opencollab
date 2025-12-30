import { Router, Response } from "express";
import axios from "axios";
import { AuthRequest, authRequired } from "../middleware/auth";
import { User } from "../models/User";
import {
  Issue,
  type IssueDocument,
  type IssueStatus,
  type IssueUpdateItem
} from "../models/Issue";
import { notifications, type NotificationDto } from "./notifications.routes";

const router = Router();

const DEFAULT_OWNER = "GoogleCloudPlatform";
const DEFAULT_REPO = "agent-starter-pack";
const GITHUB_API_TOKEN = process.env.GITHUB_API_TOKEN;

const REFRESH_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

function ghHeaders(userToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "opencollab-app"
  };

  // Prefer logged-in user's token, fallback to server token
  if (userToken) headers.Authorization = `Bearer ${userToken}`;
  else if (GITHUB_API_TOKEN) headers.Authorization = `Bearer ${GITHUB_API_TOKEN}`;

  return headers;
}

function shortId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function isBeginnerLabel(l: string) {
  const x = l.toLowerCase();
  return x === "good first issue" || x === "good-first-issue" || x.includes("beginner");
}

async function getRepoMeta(owner: string, repo: string, userToken?: string) {
  const url = `https://api.github.com/repos/${owner}/${repo}`;
  const res = await axios.get(url, { headers: ghHeaders(userToken) });
  return res.data as {
    clone_url: string;
    language: string | null;
    default_branch: string;
    open_issues_count: number;
  };
}

function buildGitFlowCommands(owner: string, repo: string, issueNumber: number, repoMeta: any) {
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

function buildProjectSetupCommands(repoMeta: any) {
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

function buildRequiredSkills(labels: string[], repoLanguage: string | null) {
  const fromLabels = (labels || []).filter((l) => !isBeginnerLabel(l)).slice(0, 6);
  if (fromLabels.length) return fromLabels;

  const lang = (repoLanguage || "").toLowerCase();
  if (["javascript", "typescript"].includes(lang)) return ["JavaScript", "React", "Git", "Testing"];
  if (lang === "python") return ["Python", "Git", "Testing"];
  return ["Git", "Debugging", "Testing"];
}

function buildExpectedOutcome(params: {
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
  else out.push("Run the project’s build/test steps and confirm expected output.");

  out.push(`Open a PR referencing #${params.issueNumber} with clear verification steps.`);

  return Array.from(new Set(out)).slice(0, 8);
}

function sameArray(a: any[], b: any[]) {
  return JSON.stringify(a ?? []) === JSON.stringify(b ?? []);
}

/**
 * Stable "opened" event (never duplicates).
 */
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

// ------- GitHub -> Mongo sync -------
async function syncIssueFromGitHub(
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

  const suggestedResources = [
    { title: "GitHub Pull Request Guide", url: "https://docs.github.com/en/pull-requests" },
    { title: "How to write a good commit message", url: "https://cbea.ms/git-commit/" }
  ];

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

  // If unchanged in GitHub updatedAt, still merge comments (safe) and update lastSyncedAt
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

    existing.lastSyncedAt = new Date(); // ✅ always update last sync time
    await existing.save();
    return existing;
  }

  if (!existing) {
    const created = await Issue.create({
      ...baseData,
      status,

      lastSyncedAt: new Date(), // ✅

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

  // Update GitHub fields
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

  existing.lastSyncedAt = new Date(); // ✅
  await existing.save();
  return existing;
}

// ------- Routes -------
router.get("/:id", authRequired, async (req: AuthRequest, res: Response) => {
  const idParam = req.params.id;

  try {
    const githubNumber = Number(idParam);

    // -------- GitHub number --------
    if (!Number.isNaN(githubNumber)) {
      // ✅ DB FIRST
      const fromDb = await Issue.findOne({
        repoOwner: DEFAULT_OWNER,
        repoName: DEFAULT_REPO,
        githubNumber
      });

      if (fromDb) return res.json(fromDb);

      // ✅ Not in DB -> fetch ONCE
      const user = await User.findById(req.userId).select("githubAccessToken");
      const userToken = user?.githubAccessToken || undefined;

      const issue = await syncIssueFromGitHub(DEFAULT_OWNER, DEFAULT_REPO, githubNumber, userToken);
      if (!issue) return res.status(404).json({ message: "Issue not found" });

      return res.json(issue);
    }

    // -------- Mongo ObjectId --------
    const issueById = await Issue.findById(idParam);
    if (!issueById) return res.status(404).json({ message: "Issue not found" });

    return res.json(issueById);
  } catch (err) {
    console.error("GET /api/issues/:id error:", err);
    return res.status(500).json({ message: "Failed to load issue" });
  }
});

router.post("/:id/refresh", authRequired, async (req: AuthRequest, res: Response) => {
  const githubNumber = Number(req.params.id);
  if (Number.isNaN(githubNumber)) {
    return res.status(400).json({ message: "Invalid issue id" });
  }

  try {
    const issue = await Issue.findOne({
      repoOwner: DEFAULT_OWNER,
      repoName: DEFAULT_REPO,
      githubNumber
    });

    if (!issue) return res.status(404).json({ message: "Issue not found" });

    // ⏱️ cooldown
    const last = issue.lastSyncedAt ? new Date(issue.lastSyncedAt).getTime() : 0;
    const now = Date.now();

    if (last && now - last < REFRESH_COOLDOWN_MS) {
      return res.status(429).json({
        message: "Refresh allowed once every 10 minutes",
        nextAllowedInSec: Math.ceil((REFRESH_COOLDOWN_MS - (now - last)) / 1000)
      });
    }

    const user = await User.findById(req.userId).select("githubAccessToken");
    const userToken = user?.githubAccessToken || undefined;

    const refreshed = await syncIssueFromGitHub(DEFAULT_OWNER, DEFAULT_REPO, githubNumber, userToken);
    if (!refreshed) return res.status(404).json({ message: "Issue not found" });

    // syncIssueFromGitHub already sets lastSyncedAt
    return res.json({ message: "Issue refreshed", issue: refreshed });
  } catch (err) {
    console.error("POST /api/issues/:id/refresh error:", err);
    return res.status(500).json({ message: "Failed to refresh issue" });
  }
});

router.post("/:id/claim", authRequired, async (req: AuthRequest, res: Response) => {
  const githubNumber = Number(req.params.id);
  if (Number.isNaN(githubNumber)) return res.status(400).json({ message: "Invalid issue id" });
  if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const issue = await Issue.findOne({ repoOwner: DEFAULT_OWNER, repoName: DEFAULT_REPO, githubNumber });
    if (!issue) return res.status(404).json({ message: "Issue not found" });
    if (issue.status === "closed") return res.status(400).json({ message: "Issue is closed." });

    const user = await User.findById(req.userId).select("login");
    if (!user) return res.status(404).json({ message: "User not found" });

    const displayName = user.login || req.userId;

    if (issue.status === "claimed" && issue.claimedByUserId !== req.userId) {
      return res.status(403).json({ message: `Issue already claimed by ${issue.claimedByLogin}.` });
    }
    if (issue.status === "claimed" && issue.claimedByUserId === req.userId) {
      return res.status(200).json({ message: "Issue already claimed by this user.", issue });
    }

    issue.status = "claimed";
    issue.claimedByUserId = req.userId;
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
    return res.status(200).json({ message: "Issue successfully claimed.", issue });
  } catch (err) {
    console.error("POST /api/issues/:id/claim error:", err);
    return res.status(500).json({ message: "Failed to claim this issue." });
  }
});

router.post("/:id/abort", authRequired, async (req: AuthRequest, res: Response) => {
  const githubNumber = Number(req.params.id);
  if (Number.isNaN(githubNumber)) return res.status(400).json({ message: "Invalid issue id" });
  if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const issue = await Issue.findOne({ repoOwner: DEFAULT_OWNER, repoName: DEFAULT_REPO, githubNumber });
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    if (issue.status !== "claimed" || !issue.claimedByUserId) {
      return res.status(400).json({ message: "Issue is not currently claimed." });
    }

    if (issue.claimedByUserId !== req.userId) {
      return res.status(403).json({ message: "You cannot abort an issue claimed by someone else." });
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

    return res.status(200).json({ message: "Issue successfully aborted.", issue });
  } catch (err) {
    console.error("POST /api/issues/:id/abort error:", err);
    return res.status(500).json({ message: "Failed to abort this issue." });
  }
});

router.post("/:id/notify", authRequired, async (req: AuthRequest, res: Response) => {
  const githubNumber = Number(req.params.id);
  if (Number.isNaN(githubNumber)) return res.status(400).json({ message: "Invalid issue id" });
  if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const issue = await Issue.findOne({ repoOwner: DEFAULT_OWNER, repoName: DEFAULT_REPO, githubNumber });
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    if (issue.status === "open") {
      return res.status(400).json({ message: "Issue is already open – you can claim it now." });
    }

    if (!issue.notifyWatchers.includes(req.userId)) {
      issue.notifyWatchers.push(req.userId);
      await issue.save();
    }

    return res.status(200).json({
      message: "You will be notified when this issue becomes available.",
      issue
    });
  } catch (err) {
    console.error("POST /api/issues/:id/notify error:", err);
    return res.status(500).json({ message: "Failed to set notification for this issue." });
  }
});

export default router;