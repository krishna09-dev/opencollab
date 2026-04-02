import { Router, Response } from "express";
import mongoose from "mongoose";
import { AuthRequest, authRequired } from "../middleware/auth";
import { moderatorOrAdminRequired } from "../middleware/adminAuth";
import { validate } from "../middleware/validate";
import { z } from "zod";
import { Report, ReportTargetType, ReportStatus, ReportReason } from "../models/Report";
import { User } from "../models/User";
import { Issue } from "../models/Issue";
import { PrTracking } from "../models/PrTracking";

const router = Router();

// ==================== VALIDATION SCHEMAS ====================

const submitReportSchema = z.object({
  body: z.object({
    targetType: z.enum(["issue", "pr", "user"]),
    targetId: z.string().min(1),
    reason: z.enum(["spam", "inappropriate", "misleading", "duplicate", "outdated", "harassment", "other"]),
    description: z.string().min(10).max(2000),
    evidence: z.string().max(1000).optional()
  })
});

const listReportsSchema = z.object({
  query: z.object({
    page: z.string().default("1"),
    limit: z.string().default("20"),
    status: z.enum(["pending", "reviewing", "resolved", "dismissed"]).optional(),
    targetType: z.enum(["issue", "pr", "user"]).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    search: z.string().optional()
  })
});

const updateReportSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    status: z.enum(["pending", "reviewing", "resolved", "dismissed"]).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    resolution: z.string().max(1000).optional(),
    actionTaken: z.string().max(500).optional()
  })
});

const reportIdSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

// ==================== USER ROUTES ====================

router.use(authRequired);

// POST /api/reports - Submit a report
router.post(
  "/",
  validate(submitReportSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { targetType, targetId, reason, description, evidence } = req.validated!.body;

      if (!mongoose.isValidObjectId(targetId)) {
        return res.status(400).json({ message: "Invalid target ID" });
      }

      // Validate target exists
      let targetRef: string | null = null;

      if (targetType === "issue") {
        const issue = await Issue.findById(targetId).select("repoOwner repoName githubNumber");
        if (!issue) {
          return res.status(404).json({ message: "Issue not found" });
        }
        targetRef = `${issue.repoOwner}/${issue.repoName}#${issue.githubNumber}`;
      } else if (targetType === "pr") {
        const pr = await PrTracking.findById(targetId).select("repoFullName prNumber");
        if (!pr) {
          return res.status(404).json({ message: "PR not found" });
        }
        targetRef = `${pr.repoFullName}#${pr.prNumber}`;
      } else if (targetType === "user") {
        const user = await User.findById(targetId).select("login");
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        targetRef = `@${user.login}`;
      }

      // Get reporter info
      const reporter = await User.findById(req.userId).select("login");
      if (!reporter) {
        return res.status(401).json({ message: "Reporter not found" });
      }

      // Check for duplicate report
      const existingReport = await Report.findOne({
        reporterId: req.userId,
        targetType,
        targetId
      });

      if (existingReport) {
        return res.status(409).json({
          message: "You have already reported this item",
          reportId: existingReport._id
        });
      }

      // Determine priority based on reason
      let priority: "low" | "medium" | "high" = "medium";
      if (reason === "harassment" || reason === "spam") {
        priority = "high";
      } else if (reason === "outdated" || reason === "duplicate") {
        priority = "low";
      }

      const report = new Report({
        reporterId: req.userId,
        reporterLogin: reporter.login,
        targetType,
        targetId,
        targetRef,
        reason,
        description,
        evidence,
        priority
      });

      await report.save();

      return res.status(201).json({
        message: "Report submitted successfully",
        report: {
          _id: report._id,
          targetType,
          targetRef,
          reason,
          status: report.status,
          createdAt: report.createdAt
        }
      });
    } catch (err: any) {
      if (err.code === 11000) {
        return res.status(409).json({ message: "You have already reported this item" });
      }
      console.error("POST /api/reports error:", err);
      return res.status(500).json({ message: "Failed to submit report" });
    }
  }
);

// GET /api/reports/my - Get user's own reports
router.get("/my", async (req: AuthRequest, res: Response) => {
  try {
    const reports = await Report.find({ reporterId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("targetType targetRef reason status createdAt reviewedAt")
      .lean();

    return res.json({ reports });
  } catch (err) {
    console.error("GET /api/reports/my error:", err);
    return res.status(500).json({ message: "Failed to load reports" });
  }
});

// ==================== ADMIN/MODERATOR ROUTES ====================

// GET /api/reports - List all reports (admin/mod only)
router.get(
  "/",
  moderatorOrAdminRequired,
  validate(listReportsSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page, limit, status, targetType, priority, search } = req.validated!.query;

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const skip = (pageNum - 1) * limitNum;

      const filter: Record<string, any> = {};

      if (status) filter.status = status;
      if (targetType) filter.targetType = targetType;
      if (priority) filter.priority = priority;

      if (search && search.trim()) {
        filter.$or = [
          { targetRef: { $regex: new RegExp(search.trim(), "i") } },
          { reporterLogin: { $regex: new RegExp(search.trim(), "i") } },
          { description: { $regex: new RegExp(search.trim(), "i") } }
        ];
      }

      const [reports, total] = await Promise.all([
        Report.find(filter)
          .sort({ priority: -1, createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Report.countDocuments(filter)
      ]);

      return res.json({
        reports,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (err) {
      console.error("GET /api/reports error:", err);
      return res.status(500).json({ message: "Failed to load reports" });
    }
  }
);

// GET /api/reports/stats - Report statistics
router.get(
  "/stats",
  moderatorOrAdminRequired,
  async (_req: AuthRequest, res: Response) => {
    try {
      const [
        totalPending,
        totalReviewing,
        totalResolved,
        totalDismissed,
        highPriority,
        byType,
        byReason
      ] = await Promise.all([
        Report.countDocuments({ status: "pending" }),
        Report.countDocuments({ status: "reviewing" }),
        Report.countDocuments({ status: "resolved" }),
        Report.countDocuments({ status: "dismissed" }),
        Report.countDocuments({ status: "pending", priority: "high" }),
        Report.aggregate([
          { $group: { _id: "$targetType", count: { $sum: 1 } } }
        ]),
        Report.aggregate([
          { $group: { _id: "$reason", count: { $sum: 1 } } }
        ])
      ]);

      return res.json({
        totalPending,
        totalReviewing,
        totalResolved,
        totalDismissed,
        highPriority,
        byType: Object.fromEntries(byType.map(t => [t._id, t.count])),
        byReason: Object.fromEntries(byReason.map(r => [r._id, r.count]))
      });
    } catch (err) {
      console.error("GET /api/reports/stats error:", err);
      return res.status(500).json({ message: "Failed to load report stats" });
    }
  }
);

// GET /api/reports/:id - Get report details
router.get(
  "/:id",
  moderatorOrAdminRequired,
  validate(reportIdSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.validated!.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid report ID" });
      }

      const report = await Report.findById(id).lean();
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Fetch target details
      let targetDetails: any = null;
      if (report.targetType === "issue") {
        targetDetails = await Issue.findById(report.targetId)
          .select("title githubUrl status beginnerFriendly isApproved isVisible")
          .lean();
      } else if (report.targetType === "pr") {
        targetDetails = await PrTracking.findById(report.targetId)
          .select("prTitle prUrl status prAuthor")
          .lean();
      } else if (report.targetType === "user") {
        targetDetails = await User.findById(report.targetId)
          .select("login avatarUrl role createdAt")
          .lean();
      }

      return res.json({
        report,
        targetDetails
      });
    } catch (err) {
      console.error("GET /api/reports/:id error:", err);
      return res.status(500).json({ message: "Failed to load report" });
    }
  }
);

// PATCH /api/reports/:id - Update report status
router.patch(
  "/:id",
  moderatorOrAdminRequired,
  validate(updateReportSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.validated!.params;
      const updates = req.validated!.body;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid report ID" });
      }

      const report = await Report.findById(id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Get reviewer info
      const reviewer = await User.findById(req.userId).select("login");

      // Update fields
      if (updates.status) report.status = updates.status;
      if (updates.priority) report.priority = updates.priority;
      if (updates.resolution) report.resolution = updates.resolution;
      if (updates.actionTaken) report.actionTaken = updates.actionTaken;

      // Mark as reviewed if resolving/dismissing
      if (updates.status === "resolved" || updates.status === "dismissed") {
        report.reviewedBy = new mongoose.Types.ObjectId(req.userId!);
        report.reviewedByLogin = reviewer?.login || null;
        report.reviewedAt = new Date();
      }

      await report.save();

      return res.json({
        message: "Report updated",
        report
      });
    } catch (err) {
      console.error("PATCH /api/reports/:id error:", err);
      return res.status(500).json({ message: "Failed to update report" });
    }
  }
);

// POST /api/reports/:id/resolve - Quick resolve a report
router.post(
  "/:id/resolve",
  moderatorOrAdminRequired,
  validate(reportIdSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.validated!.params;
      const { actionTaken, resolution } = req.body;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid report ID" });
      }

      const reviewer = await User.findById(req.userId).select("login");

      const report = await Report.findByIdAndUpdate(
        id,
        {
          $set: {
            status: "resolved",
            reviewedBy: req.userId,
            reviewedByLogin: reviewer?.login,
            reviewedAt: new Date(),
            actionTaken: actionTaken || "Reviewed and resolved",
            resolution: resolution || null
          }
        },
        { new: true }
      );

      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      return res.json({
        message: "Report resolved",
        report
      });
    } catch (err) {
      console.error("POST /api/reports/:id/resolve error:", err);
      return res.status(500).json({ message: "Failed to resolve report" });
    }
  }
);

// POST /api/reports/:id/dismiss - Dismiss a report
router.post(
  "/:id/dismiss",
  moderatorOrAdminRequired,
  validate(reportIdSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.validated!.params;
      const { resolution } = req.body;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid report ID" });
      }

      const reviewer = await User.findById(req.userId).select("login");

      const report = await Report.findByIdAndUpdate(
        id,
        {
          $set: {
            status: "dismissed",
            reviewedBy: req.userId,
            reviewedByLogin: reviewer?.login,
            reviewedAt: new Date(),
            actionTaken: "No action - dismissed",
            resolution: resolution || "Report dismissed after review"
          }
        },
        { new: true }
      );

      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      return res.json({
        message: "Report dismissed",
        report
      });
    } catch (err) {
      console.error("POST /api/reports/:id/dismiss error:", err);
      return res.status(500).json({ message: "Failed to dismiss report" });
    }
  }
);

export default router;
