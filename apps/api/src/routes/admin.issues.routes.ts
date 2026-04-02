import { Router, Response } from "express";
import mongoose from "mongoose";
import { AuthRequest, authRequired } from "../middleware/auth";
import { moderatorOrAdminRequired } from "../middleware/adminAuth";
import { validate } from "../middleware/validate";
import {
  listIssuesAdminSchema,
  updateIssueAdminSchema,
  issueIdParamSchema
} from "../validators/admin.validator";
import { Issue } from "../models/Issue";
import {
  applyIssueRepoScope,
  canAccessRepoByOwnerName,
  getModerationScope
} from "../services/moderationScope.service";

const router = Router();

type IssueDifficulty = "beginner" | "intermediate" | "advanced";

const BEGINNER_LABEL_REGEX = /good first issue|good-first-issue|help wanted|beginner|easy|starter|first-timer|documentation|docs|typo/i;
const ADVANCED_LABEL_REGEX = /advanced|expert|complex|senior|hard|difficult|architecture|breaking|major|refactor|performance|security/i;

function isBeginnerLabel(label: string) {
  const value = String(label || "").toLowerCase();
  return (
    value === "good first issue" ||
    value === "good-first-issue" ||
    value === "help wanted" ||
    value.includes("beginner") ||
    value.includes("easy") ||
    value.includes("starter") ||
    value.includes("first-timer") ||
    value.includes("documentation") ||
    value.includes("docs") ||
    value.includes("typo")
  );
}

function hasAdvancedLabel(label: string) {
  return ADVANCED_LABEL_REGEX.test(String(label || ""));
}

function inferIssueDifficulty(issue: {
  beginnerFriendly?: boolean;
  labels?: string[];
  requiredSkills?: string[];
  body?: string;
  difficultyOverride?: IssueDifficulty | null;
}): IssueDifficulty {
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

  // Prioritize explicit beginner markers - if marked as beginner-friendly or has
  // beginner labels, classify as beginner unless it also has advanced signals
  if (hasBeginnerSignals && !hasAdvancedSignals) return "beginner";
  if (hasAdvancedSignals && !hasBeginnerSignals) return "advanced";
  // If both or neither, default to intermediate
  if (hasBeginnerSignals && hasAdvancedSignals) return "intermediate";
  return "intermediate";
}

function advancedSignalsFilter() {
  return [
    { labels: { $regex: ADVANCED_LABEL_REGEX } },
    { "requiredSkills.5": { $exists: true } },
    {
      $expr: {
        $gt: [{ $strLenCP: { $ifNull: ["$body", ""] } }, 2000]
      }
    }
  ];
}

// All routes require auth + moderator or admin
router.use(authRequired);
router.use(moderatorOrAdminRequired);

// GET /api/admin/issues - List all issues with pagination
router.get(
  "/issues",
  validate(listIssuesAdminSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const scope = await getModerationScope(req.userId!);
      if (!scope) {
        return res.status(403).json({ message: "Admin or moderator access required" });
      }

      const { page, limit, status, difficulty, isApproved, isVisible, search, repoFullName } =
        req.validated!.query;

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const skip = (pageNum - 1) * limitNum;

      const filter: Record<string, any> = {};

      if (status) {
        filter.status = status;
      }

      const beginnerSignals = [
        { beginnerFriendly: true },
        { labels: { $regex: BEGINNER_LABEL_REGEX } }
      ];
      const advSignals = advancedSignalsFilter();

      const noDifficultyOverride = {
        $or: [{ difficultyOverride: { $exists: false } }, { difficultyOverride: null }]
      };

      let autoDifficultyFilter: Record<string, any> | null = null;

      if (difficulty === "beginner") {
        autoDifficultyFilter = {
          $and: [{ $or: beginnerSignals }, { $nor: advSignals }]
        };
      } else if (difficulty === "intermediate") {
        autoDifficultyFilter = {
          $or: [
            {
              $and: [{ $nor: beginnerSignals }, { $nor: advSignals }]
            },
            {
              $and: [{ $or: beginnerSignals }, { $or: advSignals }]
            }
          ]
        };
      } else if (difficulty === "advanced") {
        autoDifficultyFilter = {
          $and: [{ $or: advSignals }, { $nor: beginnerSignals }]
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

      if (isApproved !== undefined) {
        filter.isApproved = isApproved === "true";
      }

      if (isVisible !== undefined) {
        filter.isVisible = isVisible === "true";
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
          { repoName: { $regex: new RegExp(s, "i") } },
          { repoOwner: { $regex: new RegExp(s, "i") } }
        ];
      }

      applyIssueRepoScope(filter, scope);

      const [issues, total] = await Promise.all([
        Issue.find(filter)
          .sort({ githubUpdatedAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .select(
            "_id githubNumber repoOwner repoName title status labels " +
            "requiredSkills body beginnerFriendly difficultyOverride isApproved isVisible githubCreatedAt githubUpdatedAt githubUrl"
          )
          .lean(),
        Issue.countDocuments(filter)
      ]);

      const issuesWithDifficulty = issues.map((issue: any) => {
        const inferredDifficulty = inferIssueDifficulty(issue);
        const { body, requiredSkills, difficultyOverride, ...rest } = issue;
        return {
          ...rest,
          difficulty: inferredDifficulty
        };
      });

      return res.json({
        issues: issuesWithDifficulty,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (err) {
      console.error("GET /api/admin/issues error:", err);
      return res.status(500).json({ message: "Failed to load issues" });
    }
  }
);

// GET /api/admin/issues/repositories - List issue counts grouped by repository
router.get(
  "/issues/repositories",
  validate(listIssuesAdminSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const scope = await getModerationScope(req.userId!);
      if (!scope) {
        return res.status(403).json({ message: "Admin or moderator access required" });
      }

      const { status, difficulty, isApproved, isVisible, search } = req.validated!.query;

      const filter: Record<string, any> = {};

      if (status) {
        filter.status = status;
      }

      const beginnerSignals = [
        { beginnerFriendly: true },
        { labels: { $regex: BEGINNER_LABEL_REGEX } }
      ];
      const advSignals = advancedSignalsFilter();

      const noDifficultyOverride = {
        $or: [{ difficultyOverride: { $exists: false } }, { difficultyOverride: null }]
      };

      let autoDifficultyFilter: Record<string, any> | null = null;

      if (difficulty === "beginner") {
        autoDifficultyFilter = {
          $and: [{ $or: beginnerSignals }, { $nor: advSignals }]
        };
      } else if (difficulty === "intermediate") {
        autoDifficultyFilter = {
          $or: [
            {
              $and: [{ $nor: beginnerSignals }, { $nor: advSignals }]
            },
            {
              $and: [{ $or: beginnerSignals }, { $or: advSignals }]
            }
          ]
        };
      } else if (difficulty === "advanced") {
        autoDifficultyFilter = {
          $and: [{ $or: advSignals }, { $nor: beginnerSignals }]
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

      if (isApproved !== undefined) {
        filter.isApproved = isApproved === "true";
      }

      if (isVisible !== undefined) {
        filter.isVisible = isVisible === "true";
      }

      if (search && search.trim()) {
        const s = search.trim();
        filter.$or = [
          { title: { $regex: new RegExp(s, "i") } },
          { repoName: { $regex: new RegExp(s, "i") } },
          { repoOwner: { $regex: new RegExp(s, "i") } }
        ];
      }

      applyIssueRepoScope(filter, scope);

      const repositories = await Issue.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              repoOwner: "$repoOwner",
              repoName: "$repoName"
            },
            totalIssues: { $sum: 1 },
            openIssues: {
              $sum: {
                $cond: [{ $eq: ["$status", "open"] }, 1, 0]
              }
            },
            claimedIssues: {
              $sum: {
                $cond: [{ $eq: ["$status", "claimed"] }, 1, 0]
              }
            },
            closedIssues: {
              $sum: {
                $cond: [{ $eq: ["$status", "closed"] }, 1, 0]
              }
            },
            approvedIssues: {
              $sum: {
                $cond: ["$isApproved", 1, 0]
              }
            },
            visibleIssues: {
              $sum: {
                $cond: ["$isVisible", 1, 0]
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            repoOwner: "$_id.repoOwner",
            repoName: "$_id.repoName",
            fullName: {
              $concat: ["$_id.repoOwner", "/", "$_id.repoName"]
            },
            totalIssues: 1,
            openIssues: 1,
            claimedIssues: 1,
            closedIssues: 1,
            approvedIssues: 1,
            pendingIssues: {
              $subtract: ["$totalIssues", "$approvedIssues"]
            },
            visibleIssues: 1
          }
        },
        {
          $sort: {
            totalIssues: -1,
            fullName: 1
          }
        }
      ]);

      return res.json({ repositories });
    } catch (err) {
      console.error("GET /api/admin/issues/repositories error:", err);
      return res.status(500).json({ message: "Failed to load repositories" });
    }
  }
);

// GET /api/admin/issues/stats - Get issue statistics
router.get("/issues/stats", async (req: AuthRequest, res: Response) => {
  try {
    const scope = await getModerationScope(req.userId!);
    if (!scope) {
      return res.status(403).json({ message: "Admin or moderator access required" });
    }

    const baseFilter: Record<string, any> = {};
    applyIssueRepoScope(baseFilter, scope);

    const [total, approved, visible, pending, beginnerFriendly] = await Promise.all([
      Issue.countDocuments({ ...baseFilter }),
      Issue.countDocuments({ ...baseFilter, isApproved: true }),
      Issue.countDocuments({ ...baseFilter, isVisible: true }),
      Issue.countDocuments({ ...baseFilter, isApproved: false }),
      Issue.countDocuments({ ...baseFilter, beginnerFriendly: true })
    ]);

    return res.json({
      total,
      approved,
      visible,
      pending,
      beginnerFriendly
    });
  } catch (err) {
    console.error("GET /api/admin/issues/stats error:", err);
    return res.status(500).json({ message: "Failed to load stats" });
  }
});

// PATCH /api/admin/issues/:id - Update issue moderation fields
router.patch(
  "/issues/:id",
  validate(updateIssueAdminSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const scope = await getModerationScope(req.userId!);
      if (!scope) {
        return res.status(403).json({ message: "Admin or moderator access required" });
      }

      const { id } = req.validated!.params;
      const updates = req.validated!.body;
      const { difficulty, ...restUpdates } = updates;
      const updatePayload: Record<string, any> = { ...restUpdates };

      if (difficulty) {
        updatePayload.difficultyOverride = difficulty;
      }

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid issue ID" });
      }

      const issue = await Issue.findById(id).select(
        "_id githubNumber repoOwner repoName title status labels " +
        "requiredSkills body beginnerFriendly difficultyOverride isApproved isVisible"
      );

      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }

      if (!canAccessRepoByOwnerName(scope, issue.repoOwner, issue.repoName)) {
        return res.status(403).json({ message: "Issue not in your moderation scope" });
      }

      Object.entries(updatePayload).forEach(([key, value]) => {
        (issue as any)[key] = value;
      });

      await issue.save();

      const issueObject = issue.toObject() as any;
      const resolvedDifficulty = inferIssueDifficulty(issueObject);
      const { body, requiredSkills, difficultyOverride, ...restIssue } = issueObject;

      return res.json({
        issue: {
          ...restIssue,
          difficulty: resolvedDifficulty
        }
      });
    } catch (err) {
      console.error("PATCH /api/admin/issues/:id error:", err);
      return res.status(500).json({ message: "Failed to update issue" });
    }
  }
);

// POST /api/admin/issues/:id/approve - Approve an issue
router.post(
  "/issues/:id/approve",
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

      const issue = await Issue.findById(id).select(
        "_id githubNumber repoOwner repoName title isApproved isVisible"
      );

      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }

      if (!canAccessRepoByOwnerName(scope, issue.repoOwner, issue.repoName)) {
        return res.status(403).json({ message: "Issue not in your moderation scope" });
      }

      issue.isApproved = true;
      await issue.save();

      return res.json({ message: "Issue approved", issue });
    } catch (err) {
      console.error("POST /api/admin/issues/:id/approve error:", err);
      return res.status(500).json({ message: "Failed to approve issue" });
    }
  }
);

// POST /api/admin/issues/:id/reject - Reject an issue (unapprove)
router.post(
  "/issues/:id/reject",
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

      const issue = await Issue.findById(id).select(
        "_id githubNumber repoOwner repoName title isApproved isVisible"
      );

      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }

      if (!canAccessRepoByOwnerName(scope, issue.repoOwner, issue.repoName)) {
        return res.status(403).json({ message: "Issue not in your moderation scope" });
      }

      issue.isApproved = false;
      issue.isVisible = false;
      await issue.save();

      return res.json({ message: "Issue rejected", issue });
    } catch (err) {
      console.error("POST /api/admin/issues/:id/reject error:", err);
      return res.status(500).json({ message: "Failed to reject issue" });
    }
  }
);

// POST /api/admin/issues/:id/toggle-visibility - Toggle issue visibility
router.post(
  "/issues/:id/toggle-visibility",
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

      const issue = await Issue.findById(id);
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }

      if (!canAccessRepoByOwnerName(scope, issue.repoOwner, issue.repoName)) {
        return res.status(403).json({ message: "Issue not in your moderation scope" });
      }

      issue.isVisible = !issue.isVisible;
      await issue.save();

      return res.json({
        message: issue.isVisible ? "Issue is now visible" : "Issue is now hidden",
        issue: {
          _id: issue._id,
          isVisible: issue.isVisible,
          isApproved: issue.isApproved
        }
      });
    } catch (err) {
      console.error("POST /api/admin/issues/:id/toggle-visibility error:", err);
      return res.status(500).json({ message: "Failed to toggle visibility" });
    }
  }
);

// POST /api/admin/issues/bulk-approve - Bulk approve issues
router.post("/issues/bulk-approve", async (req: AuthRequest, res: Response) => {
  try {
    const scope = await getModerationScope(req.userId!);
    if (!scope) {
      return res.status(403).json({ message: "Admin or moderator access required" });
    }

    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids array required" });
    }

    const validIds = ids.filter((id) => mongoose.isValidObjectId(id));

    const updateFilter: Record<string, any> = { _id: { $in: validIds } };
    applyIssueRepoScope(updateFilter, scope);

    const result = await Issue.updateMany(updateFilter, { $set: { isApproved: true } });

    return res.json({
      message: `${result.modifiedCount} issues approved`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error("POST /api/admin/issues/bulk-approve error:", err);
    return res.status(500).json({ message: "Failed to bulk approve" });
  }
});

// POST /api/admin/issues/bulk-visibility - Bulk set visibility
router.post("/issues/bulk-visibility", async (req: AuthRequest, res: Response) => {
  try {
    const scope = await getModerationScope(req.userId!);
    if (!scope) {
      return res.status(403).json({ message: "Admin or moderator access required" });
    }

    const { ids, isVisible } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids array required" });
    }

    if (typeof isVisible !== "boolean") {
      return res.status(400).json({ message: "isVisible boolean required" });
    }

    const validIds = ids.filter((id) => mongoose.isValidObjectId(id));

    const updateFilter: Record<string, any> = { _id: { $in: validIds } };
    applyIssueRepoScope(updateFilter, scope);

    const result = await Issue.updateMany(updateFilter, { $set: { isVisible } });

    return res.json({
      message: `${result.modifiedCount} issues updated`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error("POST /api/admin/issues/bulk-visibility error:", err);
    return res.status(500).json({ message: "Failed to bulk update visibility" });
  }
});

export default router;
