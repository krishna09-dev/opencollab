import { Router, Response } from "express";
import { AuthRequest, authRequired } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  addPrByUrlSchema,
  ensureTrackingSchema,
  refreshTrackingSchema,
  getTrackingByIdSchema,
  submitPrSchema,
  refreshByIdSchema,
  getByIssueIdSchema
} from "../validators/prTracking.validator";
import { prTrackingService } from "../services/prTracking.service";

const router = Router();

// POST /api/pr-tracking/submit - Submit PR for an issue
router.post(
  "/submit",
  authRequired,
  validate(submitPrSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

      const { issueId, prUrl } = req.validated!.body;
      const item = await prTrackingService.submitPr(req.userId, issueId, prUrl);

      return res.status(201).json({
        message: "PR submitted successfully",
        item
      });
    } catch (err: any) {
      console.error("POST /api/pr-tracking/submit error:", err);
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({ message: err.message || "Failed to submit PR" });
    }
  }
);

// GET /api/pr-tracking/issue/:issueId - Get PR tracking by issue ID
router.get(
  "/issue/:issueId",
  authRequired,
  validate(getByIssueIdSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

      const item = await prTrackingService.getByIssueId(req.validated!.params.issueId, req.userId);
      if (!item) return res.status(404).json({ message: "No PR tracking found for this issue" });

      return res.json(item);
    } catch (err: any) {
      console.error("GET /api/pr-tracking/issue/:issueId error:", err);
      return res.status(500).json({ message: "Failed to load PR tracking" });
    }
  }
);

// POST /api/pr-tracking/:id/refresh - Refresh single PR by tracking ID
router.post(
  "/:id/refresh",
  authRequired,
  validate(refreshByIdSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

      const item = await prTrackingService.refreshById(req.userId, req.validated!.params.id);

      return res.json({
        message: "PR refreshed successfully",
        item
      });
    } catch (err: any) {
      console.error("POST /api/pr-tracking/:id/refresh error:", err);
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({ message: err.message || "Failed to refresh PR" });
    }
  }
);

// POST /api/pr-tracking/add - Add PR by URL
router.post(
  "/add",
  authRequired,
  validate(addPrByUrlSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

      const { prUrl } = req.validated!.body;
      const result = await prTrackingService.addPrByUrl(req.userId, prUrl);

      return res.status(result.created ? 201 : 200).json({
        message: result.created ? "PR added successfully" : "PR already exists, you have been added to viewers",
        item: result.item
      });
    } catch (err: any) {
      console.error("POST /api/pr-tracking/add error:", err);
      const statusCode = err.statusCode
        || (err.message?.includes("Invalid PR URL") ? 400 : undefined)
        || (err.message?.includes("Missing GitHub token") ? 401 : undefined)
        || (err.message?.includes("PR not found") ? 404 : undefined)
        || 500;

      if (statusCode >= 400 && statusCode < 500) {
        return res.status(statusCode).json({ message: err.message || "Failed to add PR" });
      }

      return res.status(500).json({ message: "Failed to add PR" });
    }
  }
);

// POST /api/pr-tracking/seed-demo - Seed demo data
router.post("/seed-demo", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const result = await prTrackingService.seedDemo(req.userId);

    return res.json({
      message: "Demo PR tracking data seeded",
      inserted: result.inserted,
      ids: result.ids
    });
  } catch (err) {
    console.error("POST /api/pr-tracking/seed-demo error:", err);
    return res.status(500).json({ message: "Failed to seed demo PR data" });
  }
});

// GET /api/pr-tracking - List all tracked PRs
router.get("/", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const result = await prTrackingService.listTrackedPRs(req.userId);
    return res.json(result);
  } catch (err) {
    console.error("GET /api/pr-tracking error:", err);
    return res.status(500).json({ message: "Failed to load PR tracking list" });
  }
});

// GET /api/pr-tracking/:id - Get single tracked PR
router.get(
  "/:id",
  authRequired,
  validate(getTrackingByIdSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

      const item = await prTrackingService.getTrackedPR(req.validated!.params.id, req.userId);
      if (!item) return res.status(404).json({ message: "Not found" });

      return res.json(item);
    } catch (err) {
      console.error("GET /api/pr-tracking/:id error:", err);
      return res.status(500).json({ message: "Failed to load PR detail" });
    }
  }
);

// GET /api/pr-tracking/:id/detail - Rich PR detail payload
router.get(
  "/:id/detail",
  authRequired,
  validate(getTrackingByIdSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

      const detail = await prTrackingService.getTrackedPRDetail(req.validated!.params.id, req.userId);
      if (!detail) return res.status(404).json({ message: "Not found" });

      return res.json(detail);
    } catch (err) {
      console.error("GET /api/pr-tracking/:id/detail error:", err);
      return res.status(500).json({ message: "Failed to load PR detail data" });
    }
  }
);

// POST /api/pr-tracking/ensure - Ensure tracking record exists
router.post(
  "/ensure",
  authRequired,
  validate(ensureTrackingSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

      const { repoFullName, issueNumber, issueTitle } = req.validated!.body;

      const doc = await prTrackingService.ensureTracking(req.userId, {
        repoFullName,
        issueNumber,
        issueTitle
      });

      return res.status(201).json({ message: "Tracking ensured", item: doc });
    } catch (err: any) {
      console.error("POST /api/pr-tracking/ensure error:", err);
      const statusCode = err.statusCode || 500;
      if (statusCode >= 400 && statusCode < 500) {
        return res.status(statusCode).json({ message: err.message || "Failed to ensure tracking" });
      }
      return res.status(500).json({ message: "Failed to ensure tracking" });
    }
  }
);

// POST /api/pr-tracking/refresh - Refresh tracking from GitHub (user token for manual refresh)
router.post(
  "/refresh",
  authRequired,
  validate(refreshTrackingSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

      const id = req.validated!.body.id;

      if (id) {
        // Single PR refresh
        const result = await prTrackingService.refreshSinglePr(req.userId, id);
        return res.json({
          message: result.updated ? "PR refreshed successfully" : "Nothing to refresh",
          updated: result.updated ? 1 : 0
        });
      } else {
        // Refresh all user's PRs (legacy behavior)
        const result = await prTrackingService.refreshTracking(req.userId);
        return res.json({
          message: result.updated > 0 ? "Refresh complete" : "Nothing to refresh",
          updated: result.updated
        });
      }
    } catch (err: any) {
      console.error("POST /api/pr-tracking/refresh error:", err);
      if (err.message?.includes("Missing GitHub token")) {
        return res.status(401).json({ message: err.message });
      }
      if (err.message?.includes("not found") || err.message?.includes("access denied")) {
        return res.status(404).json({ message: err.message });
      }
      return res.status(500).json({ message: "Failed to refresh PR tracking" });
    }
  }
);

export default router;
