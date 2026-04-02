import { Router, Response } from "express";
import mongoose from "mongoose";
import { AuthRequest, authRequired } from "../middleware/auth";
import { moderatorOrAdminRequired } from "../middleware/adminAuth";
import { validate } from "../middleware/validate";
import {
  listPrTrackingAdminSchema,
  verifyPrSchema,
  prIdParamSchema
} from "../validators/admin.validator";
import { PrTracking } from "../models/PrTracking";
import { Issue } from "../models/Issue";
import { User } from "../models/User";
import {
  applyIssueRepoScope,
  applyRepoFullNameScope,
  canAccessRepoFullName,
  getModerationScope
} from "../services/moderationScope.service";

const router = Router();

type IssueDifficulty = "beginner" | "intermediate" | "advanced";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toExactCaseInsensitiveRegex(value: string) {
  return new RegExp(`^${escapeRegex(value)}$`, "i");
}

function isBeginnerLabel(label: string) {
  const value = label.toLowerCase();
  return (
    value === "good first issue" ||
    value === "good-first-issue" ||
    value.includes("beginner") ||
    value.includes("easy") ||
    value.includes("starter") ||
    value.includes("first-timer")
  );
}

function hasAdvancedLabel(label: string) {
  return /advanced|expert|complex|senior|hard|difficult|architecture|breaking|major|refactor|performance|security/i.test(label);
}

function inferIssueDifficulty(issue?: {
  beginnerFriendly?: boolean;
  labels?: string[];
  requiredSkills?: string[];
  body?: string | null;
  difficultyOverride?: IssueDifficulty | null;
} | null): IssueDifficulty {
  if (
    issue?.difficultyOverride === "beginner" ||
    issue?.difficultyOverride === "intermediate" ||
    issue?.difficultyOverride === "advanced"
  ) {
    return issue.difficultyOverride;
  }

  const labels = (issue?.labels || []).map((l) => String(l || "").toLowerCase());
  const hasAdvancedSignals =
    labels.some(hasAdvancedLabel) ||
    (issue?.requiredSkills || []).length > 5 ||
    String(issue?.body || "").length > 2000;

  if (hasAdvancedSignals) return "advanced";
  if (issue?.beginnerFriendly || labels.some(isBeginnerLabel)) return "beginner";
  return "intermediate";
}

function buildIssueDifficultyFilter(difficulty: IssueDifficulty) {
  const beginnerSignals = [
    { beginnerFriendly: true },
    { labels: { $regex: /good first issue|good-first-issue|beginner|easy|starter|first-timer/i } }
  ];

  const advancedSignals = [
    { labels: { $regex: /advanced|expert|complex|senior|hard|difficult|architecture|breaking|major|refactor|performance|security/i } },
    { "requiredSkills.5": { $exists: true } },
    {
      $expr: {
        $gt: [{ $strLenCP: { $ifNull: ["$body", ""] } }, 2000]
      }
    }
  ];

  const noDifficultyOverride = {
    $or: [{ difficultyOverride: { $exists: false } }, { difficultyOverride: null }]
  };

  let autoDifficultyFilter: Record<string, any>;
  if (difficulty === "beginner") {
    autoDifficultyFilter = {
      $and: [{ $or: beginnerSignals }, { $nor: advancedSignals }]
    };
  } else if (difficulty === "advanced") {
    autoDifficultyFilter = {
      $and: [{ $or: advancedSignals }, { $nor: beginnerSignals }]
    };
  } else {
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
  }

  return {
    $or: [
      { difficultyOverride: difficulty },
      { $and: [noDifficultyOverride, autoDifficultyFilter] }
    ]
  };
}

// All routes require auth + moderator or admin
router.use(authRequired);
router.use(moderatorOrAdminRequired);

// GET /api/admin/prs - List all PR tracking records
router.get(
  "/prs",
  validate(listPrTrackingAdminSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const scope = await getModerationScope(req.userId!);
      if (!scope) {
        return res.status(403).json({ message: "Admin or moderator access required" });
      }

      const { page, limit, isVerified, isValid, status, difficulty, search, repoFullName } =
        req.validated!.query;

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const skip = (pageNum - 1) * limitNum;

      const filter: Record<string, any> = {
        prUrl: { $ne: null },
        issueId: { $ne: null } // Only issue-linked PR submissions
      };

      if (isVerified !== undefined) {
        filter.isVerified = isVerified === "true";
      }

      if (isValid !== undefined) {
        filter.isValid = isValid === "true";
      }

      if (status) {
        filter.status = status;
      }

      if (repoFullName && repoFullName.trim()) {
        filter.repoFullName = { $regex: toExactCaseInsensitiveRegex(repoFullName.trim()) };
      }

      if (difficulty) {
        const issueFilter = buildIssueDifficultyFilter(difficulty as IssueDifficulty);
        applyIssueRepoScope(issueFilter, scope);
        const issueIds = await Issue.find(issueFilter).distinct("_id");
        if (issueIds.length === 0) {
          return res.json({
            prs: [],
            pagination: {
              page: pageNum,
              limit: limitNum,
              total: 0,
              totalPages: 0
            }
          });
        }
        filter.issueId = { $in: issueIds };
      }

      if (search && search.trim()) {
        const s = search.trim();
        filter.$or = [
          { prTitle: { $regex: new RegExp(s, "i") } },
          { repoFullName: { $regex: new RegExp(s, "i") } },
          { prAuthor: { $regex: new RegExp(s, "i") } }
        ];
      }

      applyRepoFullNameScope(filter, scope);

      const [prs, total] = await Promise.all([
        PrTracking.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate("userId", "login avatarUrl")
          .populate("verifiedBy", "login")
          .populate("issueId", "beginnerFriendly labels requiredSkills body difficultyOverride")
          .select(
            "_id userId repoFullName issueNumber prNumber prTitle prUrl prState " +
            "prAuthor status isVerified verifiedBy verifiedAt isValid verificationNote " +
            "createdAt additions deletions changedFiles issueId"
          )
          .lean(),
        PrTracking.countDocuments(filter)
      ]);

      const prsWithDifficulty = prs.map((pr: any) => {
        const issueData = pr.issueId && typeof pr.issueId === "object" ? pr.issueId : null;
        const { issueId, ...rest } = pr;
        return {
          ...rest,
          difficulty: inferIssueDifficulty(issueData)
        };
      });

      return res.json({
        prs: prsWithDifficulty,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (err) {
      console.error("GET /api/admin/prs error:", err);
      return res.status(500).json({ message: "Failed to load PR tracking records" });
    }
  }
);

// GET /api/admin/prs/repositories - List PR counts grouped by repository
router.get(
  "/prs/repositories",
  validate(listPrTrackingAdminSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const scope = await getModerationScope(req.userId!);
      if (!scope) {
        return res.status(403).json({ message: "Admin or moderator access required" });
      }

      const { isVerified, isValid, status, difficulty, search, repoFullName } =
        req.validated!.query;

      const filter: Record<string, any> = {
        prUrl: { $ne: null },
        issueId: { $ne: null }
      };

      if (isVerified !== undefined) {
        filter.isVerified = isVerified === "true";
      }

      if (isValid !== undefined) {
        filter.isValid = isValid === "true";
      }

      if (status) {
        filter.status = status;
      }

      if (repoFullName && repoFullName.trim()) {
        filter.repoFullName = { $regex: toExactCaseInsensitiveRegex(repoFullName.trim()) };
      }

      if (difficulty) {
        const issueFilter = buildIssueDifficultyFilter(difficulty as IssueDifficulty);
        applyIssueRepoScope(issueFilter, scope);
        const issueIds = await Issue.find(issueFilter).distinct("_id");
        if (issueIds.length === 0) {
          return res.json({ repositories: [] });
        }
        filter.issueId = { $in: issueIds };
      }

      if (search && search.trim()) {
        const s = search.trim();
        filter.$or = [
          { prTitle: { $regex: new RegExp(s, "i") } },
          { repoFullName: { $regex: new RegExp(s, "i") } },
          { prAuthor: { $regex: new RegExp(s, "i") } }
        ];
      }

      applyRepoFullNameScope(filter, scope);

      const repositories = await PrTracking.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$repoFullName",
            totalPrs: { $sum: 1 },
            pendingVerification: {
              $sum: {
                $cond: [{ $eq: ["$isVerified", false] }, 1, 0]
              }
            },
            verified: {
              $sum: {
                $cond: [{ $eq: ["$isVerified", true] }, 1, 0]
              }
            },
            validPrs: {
              $sum: {
                $cond: [{ $eq: ["$isValid", true] }, 1, 0]
              }
            },
            invalidPrs: {
              $sum: {
                $cond: [{ $eq: ["$isValid", false] }, 1, 0]
              }
            },
            merged: {
              $sum: {
                $cond: [{ $eq: ["$status", "MERGED"] }, 1, 0]
              }
            },
            prOpen: {
              $sum: {
                $cond: [{ $eq: ["$status", "PR_OPEN"] }, 1, 0]
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            repoFullName: "$_id",
            totalPrs: 1,
            pendingVerification: 1,
            verified: 1,
            validPrs: 1,
            invalidPrs: 1,
            merged: 1,
            prOpen: 1
          }
        },
        {
          $sort: {
            totalPrs: -1,
            repoFullName: 1
          }
        }
      ]);

      return res.json({ repositories });
    } catch (err) {
      console.error("GET /api/admin/prs/repositories error:", err);
      return res.status(500).json({ message: "Failed to load PR repositories" });
    }
  }
);

// GET /api/admin/prs/stats - Get PR verification statistics
router.get("/prs/stats", async (req: AuthRequest, res: Response) => {
  try {
    const scope = await getModerationScope(req.userId!);
    if (!scope) {
      return res.status(403).json({ message: "Admin or moderator access required" });
    }

    const baseFilter: Record<string, any> = {
      prUrl: { $ne: null },
      issueId: { $ne: null }
    };
    applyRepoFullNameScope(baseFilter, scope);

    const [
      totalPrs,
      pendingVerification,
      verified,
      validPrs,
      invalidPrs,
      merged,
      prOpen
    ] = await Promise.all([
      PrTracking.countDocuments({ ...baseFilter }),
      PrTracking.countDocuments({ ...baseFilter, isVerified: false }),
      PrTracking.countDocuments({ ...baseFilter, isVerified: true }),
      PrTracking.countDocuments({ ...baseFilter, isValid: true }),
      PrTracking.countDocuments({ ...baseFilter, isValid: false }),
      PrTracking.countDocuments({ ...baseFilter, status: "MERGED" }),
      PrTracking.countDocuments({ ...baseFilter, status: "PR_OPEN" })
    ]);

    return res.json({
      totalPrs,
      pendingVerification,
      verified,
      validPrs,
      invalidPrs,
      merged,
      prOpen
    });
  } catch (err) {
    console.error("GET /api/admin/prs/stats error:", err);
    return res.status(500).json({ message: "Failed to load PR stats" });
  }
});

// DELETE /api/admin/prs - Delete all PR tracking records
router.delete("/prs", async (req: AuthRequest, res: Response) => {
  try {
    const scope = await getModerationScope(req.userId!);
    if (!scope) {
      return res.status(403).json({ message: "Admin or moderator access required" });
    }

    const deleteFilter: Record<string, any> = {};
    applyRepoFullNameScope(deleteFilter, scope);

    const prs = await PrTracking.find(deleteFilter).select("issueId").lean();

    const issueIdStrings = Array.from(
      new Set(
        prs
          .map((pr: any) => pr.issueId?.toString())
          .filter((id: string | undefined): id is string => Boolean(id))
      )
    );

    const deleteResult = await PrTracking.deleteMany(deleteFilter);

    let issueResetCount = 0;
    if (issueIdStrings.length > 0) {
      const issueIds = issueIdStrings.map((id) => new mongoose.Types.ObjectId(id));
      const issueUpdate = await Issue.updateMany(
        { _id: { $in: issueIds } },
        {
          $set: {
            prStatus: "NONE",
            lastPrMessage: null
          }
        }
      );
      issueResetCount = issueUpdate.modifiedCount || 0;
    }

    return res.json({
      message: "All PR tracking records deleted",
      deletedCount: deleteResult.deletedCount || 0,
      issueResetCount
    });
  } catch (err) {
    console.error("DELETE /api/admin/prs error:", err);
    return res.status(500).json({ message: "Failed to delete PR records" });
  }
});

// GET /api/admin/prs/:id - Get PR details
router.get(
  "/prs/:id",
  validate(prIdParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const scope = await getModerationScope(req.userId!);
      if (!scope) {
        return res.status(403).json({ message: "Admin or moderator access required" });
      }

      const { id } = req.validated!.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid PR ID" });
      }

      const pr = await PrTracking.findById(id)
        .populate("userId", "login avatarUrl email")
        .populate("verifiedBy", "login avatarUrl")
        .populate("issueId", "title githubNumber status claimedByLogin")
        .lean();

      if (!pr) {
        return res.status(404).json({ message: "PR not found" });
      }

      if (!canAccessRepoFullName(scope, pr.repoFullName || "")) {
        return res.status(403).json({ message: "PR not in your moderation scope" });
      }

      return res.json(pr);
    } catch (err) {
      console.error("GET /api/admin/prs/:id error:", err);
      return res.status(500).json({ message: "Failed to load PR details" });
    }
  }
);

// POST /api/admin/prs/:id/verify - Verify a PR (mark as valid or invalid)
router.post(
  "/prs/:id/verify",
  validate(verifyPrSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const scope = await getModerationScope(req.userId!);
      if (!scope) {
        return res.status(403).json({ message: "Admin or moderator access required" });
      }

      const { id } = req.validated!.params;
      const { isValid, note } = req.validated!.body;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid PR ID" });
      }

      const pr = await PrTracking.findById(id);
      if (!pr) {
        return res.status(404).json({ message: "PR not found" });
      }

      if (!canAccessRepoFullName(scope, pr.repoFullName || "")) {
        return res.status(403).json({ message: "PR not in your moderation scope" });
      }

      // Update verification status
      pr.isVerified = true;
      pr.verifiedBy = new mongoose.Types.ObjectId(req.userId!);
      pr.verifiedAt = new Date();
      pr.isValid = isValid;
      pr.verificationNote = note || null;

      await pr.save();

      // Get moderator info for response
      const moderator = await User.findById(req.userId).select("login");

      return res.json({
        message: isValid ? "PR marked as valid" : "PR marked as invalid",
        pr: {
          _id: pr._id,
          prUrl: pr.prUrl,
          isVerified: pr.isVerified,
          isValid: pr.isValid,
          verifiedBy: moderator?.login || scope.actor.login,
          verifiedAt: pr.verifiedAt,
          verificationNote: pr.verificationNote
        }
      });
    } catch (err) {
      console.error("POST /api/admin/prs/:id/verify error:", err);
      return res.status(500).json({ message: "Failed to verify PR" });
    }
  }
);

// POST /api/admin/prs/:id/detach - Detach invalid PR from issue
router.post(
  "/prs/:id/detach",
  validate(prIdParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const scope = await getModerationScope(req.userId!);
      if (!scope) {
        return res.status(403).json({ message: "Admin or moderator access required" });
      }

      const { id } = req.validated!.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid PR ID" });
      }

      const pr = await PrTracking.findById(id);
      if (!pr) {
        return res.status(404).json({ message: "PR not found" });
      }

      if (!canAccessRepoFullName(scope, pr.repoFullName || "")) {
        return res.status(403).json({ message: "PR not in your moderation scope" });
      }

      const detachedPrUrl = pr.prUrl;
      const issueId = pr.issueId;

      // Clear PR data but keep tracking record
      pr.prUrl = null;
      pr.prNumber = null;
      pr.prTitle = null;
      pr.prState = null;
      pr.prAuthor = null;
      pr.prBody = null;
      pr.status = "ACCEPTED";
      pr.isVerified = false;
      pr.verifiedBy = null;
      pr.verifiedAt = null;
      pr.isValid = null;
      pr.verificationNote = null;

      await pr.save();

      // Update the linked issue's PR status if exists
      if (issueId) {
        await Issue.findByIdAndUpdate(issueId, {
          $set: { prStatus: "NONE", lastPrMessage: null }
        });
      }

      // Get moderator info
      const moderator = await User.findById(req.userId).select("login");

      return res.json({
        message: "PR detached successfully",
        detachedPrUrl,
        detachedBy: moderator?.login || scope.actor.login
      });
    } catch (err) {
      console.error("POST /api/admin/prs/:id/detach error:", err);
      return res.status(500).json({ message: "Failed to detach PR" });
    }
  }
);

// POST /api/admin/prs/:id/reset-verification - Reset verification status
router.post(
  "/prs/:id/reset-verification",
  validate(prIdParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const scope = await getModerationScope(req.userId!);
      if (!scope) {
        return res.status(403).json({ message: "Admin or moderator access required" });
      }

      const { id } = req.validated!.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid PR ID" });
      }

      const pr = await PrTracking.findById(id);

      if (!pr) {
        return res.status(404).json({ message: "PR not found" });
      }

      if (!canAccessRepoFullName(scope, pr.repoFullName || "")) {
        return res.status(403).json({ message: "PR not in your moderation scope" });
      }

      pr.isVerified = false;
      pr.verifiedBy = null;
      pr.verifiedAt = null;
      pr.isValid = null;
      pr.verificationNote = null;
      await pr.save();

      return res.json({
        message: "Verification status reset",
        pr: {
          _id: pr._id,
          prUrl: pr.prUrl,
          isVerified: pr.isVerified
        }
      });
    } catch (err) {
      console.error("POST /api/admin/prs/:id/reset-verification error:", err);
      return res.status(500).json({ message: "Failed to reset verification" });
    }
  }
);

export default router;
