import { Router, Response } from "express";
import mongoose from "mongoose";
import { AuthRequest, authRequired } from "../middleware/auth";
import { moderatorOrAdminRequired } from "../middleware/adminAuth";
import { validate } from "../middleware/validate";
import {
  listClaimedIssuesSchema,
  forceReleaseClaimSchema,
  issueIdParamSchema
} from "../validators/admin.validator";
import { Issue } from "../models/Issue";
import { User } from "../models/User";
import {
  notifyIssueWatchersIssueAvailable,
  syncGitHubIssueState
} from "../services/issues.service";
import {
  applyIssueRepoScope,
  canAccessRepoByOwnerName,
  getModerationScope
} from "../services/moderationScope.service";

const router = Router();

// All routes require auth + moderator or admin
router.use(authRequired);
router.use(moderatorOrAdminRequired);

// GET /api/admin/claims - List all claimed issues
router.get(
  "/claims",
  validate(listClaimedIssuesSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const scope = await getModerationScope(req.userId!);
      if (!scope) {
        return res.status(403).json({ message: "Admin or moderator access required" });
      }

      const { page, limit, staleOnly, staleDays, search, repoFullName } =
        req.validated!.query;

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const skip = (pageNum - 1) * limitNum;
      const staleDaysNum = parseInt(staleDays, 10);

      const filter: Record<string, any> = {
        status: "claimed",
        claimedByUserId: { $ne: null }
      };

      // Filter for stale claims (older than staleDays)
      if (staleOnly === "true") {
        const staleDate = new Date();
        staleDate.setDate(staleDate.getDate() - staleDaysNum);
        filter.claimedAt = { $lt: staleDate };
      }

      if (repoFullName) {
        const [owner, name] = repoFullName.split("/");
        if (owner && name) {
          filter.repoOwner = owner;
          filter.repoName = name;
        }
      }

      if (search && search.trim()) {
        const s = search.trim();
        filter.$or = [
          { title: { $regex: new RegExp(s, "i") } },
          { claimedByLogin: { $regex: new RegExp(s, "i") } },
          { repoName: { $regex: new RegExp(s, "i") } }
        ];
      }

      applyIssueRepoScope(filter, scope);

      const [issues, total] = await Promise.all([
        Issue.find(filter)
          .sort({ claimedAt: 1 }) // Oldest claims first
          .skip(skip)
          .limit(limitNum)
          .select(
            "_id githubNumber repoOwner repoName title status " +
            "claimedByUserId claimedByLogin claimedAt githubUrl prStatus"
          )
          .lean(),
        Issue.countDocuments(filter)
      ]);

      // Calculate stale status for each issue
      const now = new Date();
      const staleThreshold = new Date();
      staleThreshold.setDate(staleThreshold.getDate() - staleDaysNum);

      const issuesWithStaleInfo = issues.map((issue) => {
        const claimedAt = issue.claimedAt ? new Date(issue.claimedAt) : null;
        const isStale = claimedAt ? claimedAt < staleThreshold : false;
        const daysSinceClaim = claimedAt
          ? Math.floor((now.getTime() - claimedAt.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        return {
          ...issue,
          isStale,
          daysSinceClaim
        };
      });

      return res.json({
        issues: issuesWithStaleInfo,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (err) {
      console.error("GET /api/admin/claims error:", err);
      return res.status(500).json({ message: "Failed to load claimed issues" });
    }
  }
);

// GET /api/admin/claims/stats - Get claim statistics
router.get("/claims/stats", async (req: AuthRequest, res: Response) => {
  try {
    const scope = await getModerationScope(req.userId!);
    if (!scope) {
      return res.status(403).json({ message: "Admin or moderator access required" });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const baseFilter: Record<string, any> = { status: "claimed" };
    applyIssueRepoScope(baseFilter, scope);

    const [
      totalClaimed,
      stale7Days,
      stale14Days,
      withPrOpen,
      withPrMerged
    ] = await Promise.all([
      Issue.countDocuments({ ...baseFilter }),
      Issue.countDocuments({ ...baseFilter, claimedAt: { $lt: sevenDaysAgo } }),
      Issue.countDocuments({ ...baseFilter, claimedAt: { $lt: fourteenDaysAgo } }),
      Issue.countDocuments({ ...baseFilter, prStatus: "PR_OPEN" }),
      Issue.countDocuments({ ...baseFilter, prStatus: "MERGED" })
    ]);

    return res.json({
      totalClaimed,
      stale7Days,
      stale14Days,
      withPrOpen,
      withPrMerged,
      activeClaims: totalClaimed - stale7Days
    });
  } catch (err) {
    console.error("GET /api/admin/claims/stats error:", err);
    return res.status(500).json({ message: "Failed to load claim stats" });
  }
});

// POST /api/admin/claims/:id/force-release - Force release a claim
router.post(
  "/claims/:id/force-release",
  validate(forceReleaseClaimSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const scope = await getModerationScope(req.userId!);
      if (!scope) {
        return res.status(403).json({ message: "Admin or moderator access required" });
      }

      const { id } = req.validated!.params;
      const { reason } = req.validated!.body;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid issue ID" });
      }

      const issue = await Issue.findById(id);
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }

      if (!canAccessRepoByOwnerName(scope, issue.repoOwner, issue.repoName)) {
        return res.status(403).json({ message: "Issue not in your moderation scope" });
      }

      if (issue.status !== "claimed") {
        return res.status(400).json({ message: "Issue is not currently claimed" });
      }

      try {
        await syncGitHubIssueState(issue, "open");
      } catch (err: any) {
        const statusCode = typeof err?.statusCode === "number" ? err.statusCode : 502;
        return res.status(statusCode).json({
          message: err?.message || "Failed to reopen issue on GitHub."
        });
      }

      // Get moderator info
      const moderator = await User.findById(req.userId).select("login");
      const moderatorName = moderator?.login || scope.actor.login || "Moderator";
      const previousClaimant = issue.claimedByLogin || "Unknown";

      // Release the claim
      issue.status = "open";
      issue.claimedByUserId = null;
      issue.claimedByLogin = null;
      issue.claimedAt = null;
      issue.contributionTimeline = [];

      // Add update about force release
      const releaseNote = reason
        ? `Claim force-released by ${moderatorName} and reopened on GitHub: ${reason}`
        : `Claim force-released by ${moderatorName} and reopened on GitHub (inactive claim)`;

      issue.updates.push({
        id: `force_release_${Date.now()}`,
        actorLogin: moderatorName,
        actorRole: "MODERATOR",
        body: releaseNote,
        createdAt: new Date()
      });

      const notifiedWatchers = await notifyIssueWatchersIssueAvailable(issue);

      await issue.save();

      return res.json({
        message:
          notifiedWatchers > 0
            ? `Claim released successfully. Notified ${notifiedWatchers} watcher${notifiedWatchers === 1 ? "" : "s"}.`
            : "Claim released successfully",
        issue: {
          _id: issue._id,
          githubNumber: issue.githubNumber,
          title: issue.title,
          status: issue.status,
          previousClaimant
        }
      });
    } catch (err) {
      console.error("POST /api/admin/claims/:id/force-release error:", err);
      return res.status(500).json({ message: "Failed to release claim" });
    }
  }
);

// GET /api/admin/claims/:id - Get claim details for an issue
router.get(
  "/claims/:id",
  validate(issueIdParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const scope = await getModerationScope(req.userId!);
      if (!scope) {
        return res.status(403).json({ message: "Admin or moderator access required" });
      }

      const { id } = req.validated!.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid issue ID" });
      }

      const issue = await Issue.findById(id)
        .select(
          "_id githubNumber repoOwner repoName title status " +
          "claimedByUserId claimedByLogin claimedAt prStatus lastPrMessage " +
          "updates contributionTimeline githubUrl"
        )
        .lean();

      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }

      if (!canAccessRepoByOwnerName(scope, issue.repoOwner, issue.repoName)) {
        return res.status(403).json({ message: "Issue not in your moderation scope" });
      }

      // Get claimant details if claimed
      let claimant = null;
      if (issue.claimedByUserId) {
        claimant = await User.findById(issue.claimedByUserId)
          .select("login avatarUrl email createdAt")
          .lean();
      }

      // Calculate claim duration
      const claimedAt = issue.claimedAt ? new Date(issue.claimedAt) : null;
      const now = new Date();
      const daysSinceClaim = claimedAt
        ? Math.floor((now.getTime() - claimedAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return res.json({
        issue,
        claimant,
        daysSinceClaim
      });
    } catch (err) {
      console.error("GET /api/admin/claims/:id error:", err);
      return res.status(500).json({ message: "Failed to load claim details" });
    }
  }
);

export default router;
