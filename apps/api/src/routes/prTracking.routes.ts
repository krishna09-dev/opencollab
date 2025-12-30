import { Router, Response } from "express";
import { AuthRequest, authRequired } from "../middleware/auth";
import { PrTracking } from "../models/PrTracking";
import { fetchPRsForIssue, computeStatusFromPR } from "../services/githubPr.service";
import { getGithubTokenForUser } from "../services/userToken.service";

const router = Router();

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

    const summary = {
      total: items.length,
      accepted: items.filter((x) => x.status === "ACCEPTED").length,
      open: items.filter((x) => x.status === "PR_OPEN").length,
      merged: items.filter((x) => x.status === "MERGED").length,
      closed: items.filter((x) => x.status === "CLOSED").length
    };

    return res.json({ summary, items });
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
            prUrl: best ? best.html_url : null,
            prState: best ? best.state : null,
            mergedAt: best?.merged_at ? new Date(best.merged_at) : null,
            closedAt: best?.closed_at ? new Date(best.closed_at) : null,
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