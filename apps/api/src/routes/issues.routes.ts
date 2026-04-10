import { Router, Response } from "express";
import mongoose from "mongoose";
import { AuthRequest, authRequired } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  listIssuesSchema,
  getIssueSchema,
  claimIssueSchema,
  refreshIssueSchema,
  abortIssueSchema,
  notifyIssueSchema
} from "../validators/issues.validator";
import { inferIssueDifficulty, issuesService } from "../services/issues.service";

const router = Router();

// GET /api/issues/stats
router.get("/stats", authRequired, async (_req: AuthRequest, res: Response) => {
  try {
    const stats = await issuesService.getStats();
    return res.json(stats);
  } catch (err) {
    console.error("GET /api/issues/stats error:", err);
    return res.status(500).json({ message: "Failed to load stats" });
  }
});

// GET /api/issues/languages
router.get("/languages", authRequired, async (_req: AuthRequest, res: Response) => {
  try {
    const languages = await issuesService.getAvailableLanguages();
    return res.json({ languages });
  } catch (err) {
    console.error("GET /api/issues/languages error:", err);
    return res.status(500).json({ message: "Failed to load issue languages" });
  }
});

// GET /api/issues - List issues with pagination/filters
router.get(
  "/",
  authRequired,
  validate(listIssuesSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page, limit, status, language, difficulty, search, sort } = req.validated!.query;

      const result = await issuesService.listIssues({
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        status,
        language,
        difficulty,
        search,
        sort
      });

      return res.json(result);
    } catch (err) {
      console.error("GET /api/issues error:", err);
      return res.status(500).json({ message: "Failed to load issues list" });
    }
  }
);

// GET /api/issues/:id - Get single issue
router.get(
  "/:id",
  authRequired,
  validate(getIssueSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const idParam = req.validated!.params.id;

      if (!mongoose.isValidObjectId(idParam) && Number.isNaN(Number(idParam))) {
        return res.status(400).json({ message: "Invalid issue id" });
      }

      const { issue } = await issuesService.getIssueById(idParam, req.userId);

      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }

      const issueObj: any = typeof (issue as any).toObject === "function" ? (issue as any).toObject() : issue;
      issueObj.difficulty = inferIssueDifficulty(issueObj);

      return res.json(issueObj);
    } catch (err) {
      console.error("GET /api/issues/:id error:", err);
      return res.status(500).json({ message: "Failed to load issue" });
    }
  }
);

// POST /api/issues/:id/refresh - Refresh issue from GitHub
router.post(
  "/:id/refresh",
  authRequired,
  validate(refreshIssueSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const result = await issuesService.refreshIssue(req.validated!.params.id, req.userId);

      if (!result.success) {
        if (result.retryAfterSec) {
          return res.status(429).json({
            message: result.error,
            nextAllowedInSec: result.retryAfterSec
          });
        }
        return res.status(404).json({ message: result.error });
      }

      return res.json({ message: "Issue refreshed", issue: result.issue });
    } catch (err) {
      console.error("POST /api/issues/:id/refresh error:", err);
      return res.status(500).json({ message: "Failed to refresh issue" });
    }
  }
);

// POST /api/issues/:id/claim - Claim an issue
router.post(
  "/:id/claim",
  authRequired,
  validate(claimIssueSchema),
  async (req: AuthRequest, res: Response) => {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const result = await issuesService.claimIssue(req.validated!.params.id, req.userId);
      return res.status(result.status).json(result.data);
    } catch (err) {
      console.error("POST /api/issues/:id/claim error:", err);
      return res.status(500).json({ message: "Failed to claim this issue." });
    }
  }
);

// POST /api/issues/:id/abort - Abort a claimed issue
router.post(
  "/:id/abort",
  authRequired,
  validate(abortIssueSchema),
  async (req: AuthRequest, res: Response) => {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const result = await issuesService.abortIssue(req.validated!.params.id, req.userId);
      return res.status(result.status).json(result.data);
    } catch (err) {
      console.error("POST /api/issues/:id/abort error:", err);
      return res.status(500).json({ message: "Failed to abort this issue." });
    }
  }
);

// POST /api/issues/:id/notify - Subscribe to notifications
router.post(
  "/:id/notify",
  authRequired,
  validate(notifyIssueSchema),
  async (req: AuthRequest, res: Response) => {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const result = await issuesService.notifyOnIssue(req.validated!.params.id, req.userId);
      return res.status(result.status).json(result.data);
    } catch (err) {
      console.error("POST /api/issues/:id/notify error:", err);
      return res.status(500).json({ message: "Failed to set notification for this issue." });
    }
  }
);

export default router;
