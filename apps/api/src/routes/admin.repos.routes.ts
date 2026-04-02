import { Router, Response } from "express";
import axios from "axios";
import { AuthRequest, authRequired } from "../middleware/auth";
import { adminRequired, moderatorOrAdminRequired } from "../middleware/adminAuth";
import { validate } from "../middleware/validate";
import {
  addRepoSchema,
  updateRepoSchema,
  repoIdParamSchema
} from "../validators/admin.validator";
import { ApprovedRepo } from "../models/ApprovedRepo";
import { Issue } from "../models/Issue";
import { PrTracking } from "../models/PrTracking";
import { User } from "../models/User";
import { ingestSingleRepo } from "../services/issueIngestion.service";
import {
  canAccessRepoByOwnerName,
  getModerationScope
} from "../services/moderationScope.service";
import { isSystemApprovedRepo } from "../config/approvedRepos";

const router = Router();

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toExactCaseInsensitiveRegex(value: string) {
  const escaped = escapeRegex(value);
  return new RegExp(`^${escaped}$`, "i");
}

async function clearRepoPrData(repoOwner: string, repoName: string, deleteIssues = false) {
  const repoFullName = `${repoOwner}/${repoName}`;
  const fullNameRegex = toExactCaseInsensitiveRegex(repoFullName);
  const repoOwnerRegex = toExactCaseInsensitiveRegex(repoOwner);
  const repoNameRegex = toExactCaseInsensitiveRegex(repoName);
  const repoUrlRegex = new RegExp(
    `github\\.com/${escapeRegex(repoOwner)}/${escapeRegex(repoName)}/pull/`,
    "i"
  );

  const issueFilter = {
    repoOwner: { $regex: repoOwnerRegex },
    repoName: { $regex: repoNameRegex }
  };

  const issueIds = await Issue.find(issueFilter).distinct("_id");

  const prDeleteFilter: Record<string, any> = {
    $or: [
      { repoFullName: { $regex: fullNameRegex } },
      { prUrl: { $regex: repoUrlRegex } },
      { prUrlInput: { $regex: repoUrlRegex } }
    ]
  };

  if (issueIds.length > 0) {
    prDeleteFilter.$or.push({ issueId: { $in: issueIds } });
  }

  // Delete PRs first, then handle issues
  const deleteResult = await PrTracking.deleteMany(prDeleteFilter);

  let deletedIssueCount = 0;
  let issueResetCount = 0;

  if (deleteIssues) {
    // Delete all issues for this repo
    const issueDeleteResult = await Issue.deleteMany(issueFilter);
    deletedIssueCount = issueDeleteResult.deletedCount || 0;
  } else {
    // Reset PR status and hide issues (for deactivation)
    const issueUpdate = await Issue.updateMany(issueFilter, {
      $set: {
        prStatus: "NONE",
        lastPrMessage: null,
        isVisible: false
      }
    });
    issueResetCount = issueUpdate.modifiedCount || 0;
  }

  return {
    deletedPrCount: deleteResult.deletedCount || 0,
    deletedIssueCount,
    issueResetCount
  };
}

// All routes require authentication.
// Most repo-management actions are admin-only; manual sync additionally supports
// moderators within their moderation scope.
router.use(authRequired);

// GET /api/admin/repos - List all repos
router.get("/repos", adminRequired, async (_req: AuthRequest, res: Response) => {
  try {
    const repos = await ApprovedRepo.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ repos });
  } catch (err) {
    console.error("GET /api/admin/repos error:", err);
    return res.status(500).json({ message: "Failed to load repos" });
  }
});

// POST /api/admin/repos - Add new repo
router.post(
  "/repos",
  adminRequired,
  validate(addRepoSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { fullName } = req.validated!.body;
      const [repoOwner, repoName] = fullName.split("/");

      // Check if already exists
      const existing = await ApprovedRepo.findOne({ fullName });
      if (existing) {
        return res.status(409).json({ message: "Repository already exists" });
      }

      // Verify repo exists on GitHub
      let description: string | null = null;
      let htmlUrl: string | null = null;

      try {
        const ghRes = await axios.get(`https://api.github.com/repos/${fullName}`, {
          headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "opencollab-app",
            ...(process.env.GITHUB_SYSTEM_TOKEN
              ? { Authorization: `Bearer ${process.env.GITHUB_SYSTEM_TOKEN}` }
              : {})
          }
        });
        description = ghRes.data.description || null;
        htmlUrl = ghRes.data.html_url || null;
      } catch (ghErr: any) {
        if (ghErr?.response?.status === 404) {
          return res.status(404).json({ message: "Repository not found on GitHub" });
        }
        // For other errors, continue without metadata
      }

      const repo = await ApprovedRepo.create({
        fullName,
        repoOwner,
        repoName,
        description,
        htmlUrl,
        isActive: true
      });

      return res.status(201).json({ repo });
    } catch (err) {
      console.error("POST /api/admin/repos error:", err);
      return res.status(500).json({ message: "Failed to add repo" });
    }
  }
);

// PATCH /api/admin/repos/:id - Update repo
router.patch(
  "/repos/:id",
  adminRequired,
  validate(updateRepoSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.validated!.params;
      const updates = req.validated!.body;

      const existing = await ApprovedRepo.findById(id);
      if (!existing) {
        return res.status(404).json({ message: "Repo not found" });
      }

      const repo = await ApprovedRepo.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true }
      );

      if (!repo) {
        return res.status(404).json({ message: "Repo not found" });
      }

      if (updates.isActive === false && existing.isActive !== false) {
        // Deactivation: only reset PR status, keep issues (pass false)
        const cleanup = await clearRepoPrData(existing.repoOwner, existing.repoName, false);
        return res.json({
          message: "Repo deactivated and related PRs removed",
          repo,
          cleanup
        });
      }

      return res.json({ repo });
    } catch (err) {
      console.error("PATCH /api/admin/repos/:id error:", err);
      return res.status(500).json({ message: "Failed to update repo" });
    }
  }
);

// DELETE /api/admin/repos/:id - Remove repo
router.delete(
  "/repos/:id",
  adminRequired,
  validate(repoIdParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.validated!.params;

      const repo = await ApprovedRepo.findById(id);

      if (!repo) {
        return res.status(404).json({ message: "Repo not found" });
      }

      // Delete issues when repo is deleted (pass true)
      const cleanup = await clearRepoPrData(repo.repoOwner, repo.repoName, true);

      if (isSystemApprovedRepo(repo.fullName)) {
        const updated = await ApprovedRepo.findByIdAndUpdate(
          id,
          { $set: { isActive: false } },
          { new: true }
        );

        return res.json({
          message: "Repo deactivated and related data removed",
          repo: updated,
          cleanup
        });
      }

      await ApprovedRepo.findByIdAndDelete(id);

      return res.json({
        message: "Repo deleted and related data removed",
        repo,
        cleanup
      });
    } catch (err) {
      console.error("DELETE /api/admin/repos/:id error:", err);
      return res.status(500).json({ message: "Failed to delete repo" });
    }
  }
);

// POST /api/admin/repos/:id/sync - Trigger manual sync
router.post(
  "/repos/:id/sync",
  moderatorOrAdminRequired,
  validate(repoIdParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.validated!.params;

      const repo = await ApprovedRepo.findById(id);
      if (!repo) {
        return res.status(404).json({ message: "Repo not found" });
      }

      const scope = await getModerationScope(req.userId);
      if (!scope) {
        return res.status(403).json({ message: "Admin or moderator access required" });
      }

      if (!scope.isAdmin && !canAccessRepoByOwnerName(scope, repo.repoOwner, repo.repoName)) {
        return res.status(403).json({ message: "Repository not in your moderation scope" });
      }

      let githubToken: string | undefined;

      if (!scope.isAdmin) {
        if (scope.actor.model !== "User") {
          return res.status(400).json({
            message: "Moderator GitHub token unavailable. Please sign in via /moderation."
          });
        }

        const moderator = await User.findById(scope.actor.id).select("githubAccessToken");
        githubToken = moderator?.githubAccessToken || undefined;

        if (!githubToken) {
          return res.status(400).json({
            message: "Moderator GitHub token is missing. Please log out and sign in again via /moderation."
          });
        }
      }

      const result = await ingestSingleRepo({
        fullName: repo.fullName,
        repoOwner: repo.repoOwner,
        repoName: repo.repoName,
        lastSyncedAt: null, // Force full sync
        githubToken
      });

      return res.json({
        message: "Sync completed",
        result
      });
    } catch (err) {
      console.error("POST /api/admin/repos/:id/sync error:", err);
      return res.status(500).json({ message: "Failed to sync repo" });
    }
  }
);

export default router;
