import { Router, Response } from "express";
import { AuthRequest, authRequired } from "../middleware/auth";
import { PrTracking } from "../models/PrTracking";
import { fetchPRsForIssue, computeStatusFromPR } from "../services/githubPr.service";
import { getGithubTokenForUser } from "../services/userToken.service";

const router = Router();

type UiPrStatus = "OPEN" | "IN_REVIEW" | "CHANGES_REQUESTED" | "MERGED";

function toUiStatus(item: any): UiPrStatus {
  if (item?.status === "MERGED") return "MERGED";
  if (item?.status === "PR_OPEN") {
    if (item?.reviewState === "CHANGES_REQUESTED") return "CHANGES_REQUESTED";
    if ((item?.requestedReviewersCount ?? 0) > 0 || item?.reviewState === "APPROVED" || item?.reviewState === "COMMENTED") {
      return "IN_REVIEW";
    }
  }
  return "OPEN";
}

function buildSummary(items: any[]) {
  const uiCounts = { open: 0, inReview: 0, changesRequested: 0, merged: 0 };
  for (const item of items) {
    const ui = toUiStatus(item);
    if (ui === "OPEN") uiCounts.open++;
    if (ui === "IN_REVIEW") uiCounts.inReview++;
    if (ui === "CHANGES_REQUESTED") uiCounts.changesRequested++;
    if (ui === "MERGED") uiCounts.merged++;
  }

  return {
    total: items.length,
    open: uiCounts.open,
    inReview: uiCounts.inReview,
    changesRequested: uiCounts.changesRequested,
    merged: uiCounts.merged,

    // backward-compatible fields for existing clients
    accepted: items.filter((x) => x.status === "ACCEPTED").length,
    closed: items.filter((x) => x.status === "CLOSED").length
  };
}

function splitRepo(fullName: string) {
  const [owner, repo] = String(fullName || "").split("/");
  return {
    owner: owner || "opencollab",
    repo: repo || "core-engine"
  };
}

function buildDetailPayload(item: any) {
  const { owner, repo } = splitRepo(item.repoFullName);
  const prNumber = item.prNumber ?? 42;
  const displayStatus = toUiStatus(item);
  const statusText = displayStatus === "CHANGES_REQUESTED" ? "OPEN" : displayStatus;

  return {
    id: String(item._id),
    title: item.prTitle || item.issueTitle || `Pull Request #${prNumber}`,
    number: prNumber,
    owner,
    repo,
    status: statusText,
    sourceBranch: "auth-refactor",
    targetBranch: "main",
    tags: ["Enhancement", "Auth"],
    overview: {
      author: "alex_dev",
      commentedAtLabel: "3 hours ago",
      intro:
        item.prBody ||
        "This PR replaces the legacy session-based authentication with a more robust JWT-based flow.",
      changes: [
        "Implemented AuthService using jsonwebtoken.",
        "Added middleware for token verification on protected routes.",
        "Updated client-side state management to handle token persistence.",
        "Refactored /login and /register endpoints."
      ],
      note:
        "This requires a new environment variable JWT_SECRET to be set in production.",
      linkedIssue: {
        number: item.issueNumber,
        title: item.issueTitle || "Implement Secure Auth Flow",
        openedBy: "systems_lead"
      }
    },
    timeline: [
      {
        id: "opened",
        type: "opened",
        actor: "alex_dev",
        text: "opened this pull request",
        atLabel: "3 hours ago"
      },
      {
        id: "commits",
        type: "commits",
        commits: [
          { sha: "a7b2c4e", message: "feat: implement jwt generation logic", atLabel: "2 hours ago" },
          { sha: "8d9f1e2", message: "fix: middleware error handling", atLabel: "1 hour ago" }
        ]
      },
      {
        id: "review-requested",
        type: "reviewRequested",
        actor: "alex_dev",
        reviewers: ["mike_ux", "sarah_tech"]
      },
      {
        id: "changes-requested",
        type: "changesRequested",
        actor: "mike_ux",
        atLabel: "45 mins ago",
        summary:
          "The token expiration is currently set to 30 days. We should reduce this to 1 hour and implement refresh tokens for better security.",
        diffOld: "expiresIn: '30d'",
        diffNew: "expiresIn: '1h'"
      },
      {
        id: "maintainer-feedback",
        type: "maintainerFeedback",
        title: "Maintainer Feedback",
        body:
          "Great overall implementation. Please address Mike's concern regarding the expiration time. Once that's done and CI checks pass, I'm ready to merge."
      },
      {
        id: "conversation-restricted",
        type: "restriction",
        body: "Conversation is restricted to maintainers or authorized reviewers"
      }
    ],
    sidebar: {
      reviewers: [
        { id: "sarah_tech", name: "sarah_tech", status: "approved" },
        { id: "mike_ux", name: "mike_ux", status: "changes_requested" },
        { id: "john_dev", name: "john_dev", status: "pending" }
      ],
      checks: [
        { id: "vercel", name: "Vercel Deployment", status: "success", durationLabel: "2m", progress: 100 },
        { id: "unit-tests", name: "Unit Tests (154/154)", status: "success", durationLabel: "4m", progress: 100 },
        { id: "e2e", name: "E2E Tests", status: "running", durationLabel: "Running...", progress: 65 }
      ],
      filesChangedTotal: 4,
      filesChanged: [
        { path: "src/services/auth.ts", additions: 124, deletions: 12 },
        { path: "src/middleware/auth.ts", additions: 45, deletions: 0 },
        { path: "src/routes/login.ts", additions: 12, deletions: 30 }
      ],
      linkedIssue: {
        number: item.issueNumber,
        title: item.issueTitle || "Implement Secure Auth Flow",
        openedBy: "systems_lead"
      },
      systemStatusLabel: "All systems operational"
    }
  };
}

/**
 * POST /api/pr-tracking/seed-demo
 * Inserts demo PR tracking records for current user to quickly preview detail UI.
 */
router.post("/seed-demo", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const demos = [
      {
        repoFullName: "opencollab/core-engine",
        issueNumber: 123,
        issueTitle: "Implement Secure Auth Flow",
        prNumber: 42,
        prTitle: "Refactor Authentication Flow",
        prBody:
          "This PR replaces the legacy session-based authentication with a more robust JWT-based flow and improves security boundaries.",
        prUrl: "https://github.com/opencollab/core-engine/pull/42",
        prState: "open",
        status: "PR_OPEN",
        primaryLanguage: "TypeScript",
        requestedReviewersCount: 2,
        reviewState: "CHANGES_REQUESTED",
        commentsCount: 9,
        reviewCommentsCount: 14
      },
      {
        repoFullName: "opencollab/web",
        issueNumber: 77,
        issueTitle: "Improve PR filtering UX",
        prNumber: 128,
        prTitle: "feat: Improve PR tracking filter chips",
        prBody:
          "Introduces clearer status chips and improves accessibility semantics for filter controls.",
        prUrl: "https://github.com/opencollab/web/pull/128",
        prState: "open",
        status: "PR_OPEN",
        primaryLanguage: "TypeScript",
        requestedReviewersCount: 1,
        reviewState: "COMMENTED",
        commentsCount: 3,
        reviewCommentsCount: 5
      }
    ];

    const createdIds: string[] = [];

    for (const demo of demos) {
      const record = await PrTracking.findOneAndUpdate(
        {
          userId: req.userId,
          repoFullName: demo.repoFullName,
          issueNumber: demo.issueNumber
        },
        {
          $set: {
            userId: req.userId,
            ...demo,
            syncSource: "manual",
            lastSyncAt: new Date()
          }
        },
        { upsert: true, new: true }
      ).lean();

      createdIds.push(String(record._id));
    }

    return res.json({
      message: "Demo PR tracking data seeded",
      inserted: createdIds.length,
      ids: createdIds
    });
  } catch (err) {
    console.error("POST /api/pr-tracking/seed-demo error:", err);
    return res.status(500).json({ message: "Failed to seed demo PR data" });
  }
});

/**
 * GET /api/pr-tracking
 * List all tracked PRs for current user + summary counts
 */
router.get("/", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const items = await PrTracking.find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .lean();

    const mapped = items.map((item) => ({
      ...item,
      displayStatus: toUiStatus(item)
    }));

    return res.json({ summary: buildSummary(mapped), items: mapped });
  } catch (err) {
    console.error("GET /api/pr-tracking error:", err);
    return res.status(500).json({ message: "Failed to load PR tracking list" });
  }
});

/**
 * GET /api/pr-tracking/:id
 * Single PR tracking record (only if owned by user)
 */
router.get("/:id", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const item = await PrTracking.findOne({ _id: req.params.id, userId: req.userId }).lean();
    if (!item) return res.status(404).json({ message: "Not found" });

    return res.json(item);
  } catch (err) {
    console.error("GET /api/pr-tracking/:id error:", err);
    return res.status(500).json({ message: "Failed to load PR detail" });
  }
});

/**
 * GET /api/pr-tracking/:id/detail
 * Rich PR detail payload for PR details page.
 */
router.get("/:id/detail", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const item = await PrTracking.findOne({ _id: req.params.id, userId: req.userId }).lean();
    if (!item) return res.status(404).json({ message: "Not found" });

    return res.json(buildDetailPayload(item));
  } catch (err) {
    console.error("GET /api/pr-tracking/:id/detail error:", err);
    return res.status(500).json({ message: "Failed to load PR detail data" });
  }
});

/**
 * POST /api/pr-tracking/ensure
 * Create/ensure a tracking record exists for an accepted issue (dummy integration).
 * You call this when issue is accepted OR when user opens issue detail.
 */
router.post("/ensure", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const { repoFullName, issueNumber, issueTitle } = req.body || {};
    if (!repoFullName || !issueNumber) {
      return res.status(400).json({ message: "repoFullName and issueNumber are required" });
    }

    const doc = await PrTracking.findOneAndUpdate(
      { userId: req.userId, repoFullName: String(repoFullName).trim(), issueNumber: Number(issueNumber) },
      {
        $setOnInsert: {
          userId: req.userId,
          repoFullName: String(repoFullName).trim(),
          issueNumber: Number(issueNumber),
          issueTitle: String(issueTitle ?? ""),
          status: "ACCEPTED",
          syncSource: "manual"
        }
      },
      { upsert: true, new: true }
    ).lean();

    return res.status(201).json({ message: "Tracking ensured", item: doc });
  } catch (err) {
    console.error("POST /api/pr-tracking/ensure error:", err);
    return res.status(500).json({ message: "Failed to ensure tracking" });
  }
});

/**
 * POST /api/pr-tracking/refresh
 * Manual refresh: fetch GitHub PR info using user's GitHub token
 * Body options:
 *  - { id } refresh single tracking record
 *  - { } refresh all tracking records for user
 */
router.post("/refresh", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const githubToken = await getGithubTokenForUser(req.userId);
    if (!githubToken) {
      return res.status(400).json({ message: "Missing GitHub token for user. Ensure OAuth stores it in User model." });
    }

    const id = req.body?.id as string | undefined;

    const list = id
      ? await PrTracking.find({ _id: id, userId: req.userId }).lean()
      : await PrTracking.find({ userId: req.userId }).lean();

    if (!list.length) {
      return res.json({ message: "Nothing to refresh", updated: 0 });
    }

    let updated = 0;

    for (const item of list) {
      const pulls = await fetchPRsForIssue({
        githubToken,
        repoFullName: item.repoFullName,
        issueNumber: item.issueNumber
      });

      // pick the “best” PR:
      // prefer merged, else open, else closed latest
      const best =
        pulls.find((p) => p.merged_at) ||
        pulls.find((p) => p.state === "open") ||
        pulls[0] ||
        null;

      const status = computeStatusFromPR(
        best
          ? { state: best.state, merged_at: best.merged_at, closed_at: best.closed_at }
          : null
      );

      await PrTracking.updateOne(
        { _id: item._id },
        {
          $set: {
            prNumber: best ? best.number : null,
            prTitle: best ? best.title : null,
            prBody: best ? best.body : null,
            prUrl: best ? best.html_url : null,
            prState: best ? best.state : null,
            mergedAt: best?.merged_at ? new Date(best.merged_at) : null,
            closedAt: best?.closed_at ? new Date(best.closed_at) : null,
            prUpdatedAt: best?.updated_at ? new Date(best.updated_at) : null,
            primaryLanguage: best?.language ?? null,
            requestedReviewersCount: best?.requested_reviewers_count ?? 0,
            reviewState: best?.review_state ?? null,
            commentsCount: best?.comments ?? 0,
            reviewCommentsCount: best?.review_comments ?? 0,
            status,
            lastSyncAt: new Date(),
            syncSource: "manual"
          }
        }
      );

      updated++;
    }

    return res.json({ message: "Refresh complete", updated });
  } catch (err) {
    console.error("POST /api/pr-tracking/refresh error:", err);
    return res.status(500).json({ message: "Failed to refresh PR tracking" });
  }
});

export default router;