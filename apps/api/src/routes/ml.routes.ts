import { Router, Response } from "express";
import mongoose from "mongoose";
import axios from "axios";
import { AuthRequest, authRequired } from "../middleware/auth";
import { adminRequired, moderatorOrAdminRequired } from "../middleware/adminAuth";
import { validate } from "../middleware/validate";
import { z } from "zod";
import { Issue, MlScoring, MlOverride } from "../models/Issue";
import { User } from "../models/User";
import { env } from "../config/env";

const router = Router();

const ML_SERVICE_URL = env.ML_SERVICE_URL;

// ==================== VALIDATION SCHEMAS ====================

const scoreIssueSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

const scoreBatchSchema = z.object({
  body: z.object({
    issueIds: z.array(z.string()).min(1).max(100)
  })
});

const overrideScoreSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    newScore: z.number().min(0).max(1),
    reason: z.string().min(5).max(500)
  })
});

const listScoredIssuesSchema = z.object({
  query: z.object({
    page: z.string().default("1"),
    limit: z.string().default("20"),
    minScore: z.string().optional(),
    maxScore: z.string().optional(),
    hasOverride: z.enum(["true", "false"]).optional(),
    disagreement: z.enum(["true", "false"]).optional(), // ML vs manual label
    search: z.string().optional()
  })
});

// ==================== HELPER FUNCTIONS ====================

async function computeScoreViaML(issue: {
  title: string;
  body: string;
  labels: string[];
  requiredSkills?: string[];
  beginnerFriendly?: boolean;
}): Promise<MlScoring> {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/score`, {
      title: issue.title,
      body: issue.body || "",
      labels: issue.labels || [],
      required_skills: issue.requiredSkills || [],
      manual_beginner_friendly: issue.beginnerFriendly
    }, { timeout: 10000 });

    return {
      beginnerScore: response.data.beginnerScore,
      confidence: response.data.confidence,
      features: response.data.features,
      explanation: response.data.explanation,
      scoredAt: new Date(response.data.scoredAt),
      modelVersion: response.data.modelVersion
    };
  } catch (error) {
    // Fallback: compute a basic score locally
    return computeLocalScore(issue);
  }
}

function computeLocalScore(issue: {
  title: string;
  body: string;
  labels: string[];
  requiredSkills?: string[];
}): MlScoring {
  const labels = issue.labels.map(l => l.toLowerCase());
  
  // Simple label-based scoring
  const beginnerLabels = ["good first issue", "beginner", "easy", "starter", "help wanted"];
  const labelScore = beginnerLabels.some(bl => labels.some(l => l.includes(bl))) ? 0.8 : 0.3;
  
  // Description length scoring
  const bodyLen = (issue.body || "").length;
  const descScore = bodyLen < 50 ? 0.2 : bodyLen < 200 ? 0.5 : bodyLen < 2000 ? 1.0 : 0.7;
  
  // Combine
  const beginnerScore = labelScore * 0.6 + descScore * 0.4;
  
  return {
    beginnerScore: Math.round(beginnerScore * 1000) / 1000,
    confidence: 0.5, // Lower confidence for local scoring
    features: {
      labelScore,
      descriptionLength: descScore,
      keywordScore: 0.5,
      complexityScore: 0.5,
      clarityScore: 0.5
    },
    explanation: "Scored locally (ML service unavailable)",
    scoredAt: new Date(),
    modelVersion: "local-fallback-v1"
  };
}

// ==================== PUBLIC ROUTES ====================

// GET /api/ml/health - Check ML service health
router.get("/health", async (_req, res: Response) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
    return res.json({
      status: "ok",
      mlService: response.data,
      connected: true
    });
  } catch (error) {
    return res.json({
      status: "degraded",
      mlService: null,
      connected: false,
      fallback: "local-scoring"
    });
  }
});

// GET /api/ml/model/info - Get model information
router.get("/model/info", async (_req, res: Response) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/model/info`, { timeout: 5000 });
    return res.json(response.data);
  } catch (error) {
    return res.json({
      mode: "fallback",
      method: "Simple label-based scoring",
      description: "ML service unavailable, using local fallback"
    });
  }
});

// ==================== ADMIN/MODERATOR ROUTES ====================

router.use(authRequired);

// POST /api/ml/score/:id - Score a single issue
router.post(
  "/score/:id",
  moderatorOrAdminRequired,
  validate(scoreIssueSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.validated!.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid issue ID" });
      }

      const issue = await Issue.findById(id);
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }

      const mlScoring = await computeScoreViaML({
        title: issue.title,
        body: issue.body,
        labels: issue.labels,
        requiredSkills: issue.requiredSkills,
        beginnerFriendly: issue.beginnerFriendly
      });

      issue.mlScoring = mlScoring;
      await issue.save();

      return res.json({
        message: "Issue scored successfully",
        issueId: issue._id,
        mlScoring
      });
    } catch (err) {
      console.error("POST /api/ml/score/:id error:", err);
      return res.status(500).json({ message: "Failed to score issue" });
    }
  }
);

// POST /api/ml/score-batch - Score multiple issues
router.post(
  "/score-batch",
  moderatorOrAdminRequired,
  validate(scoreBatchSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { issueIds } = req.validated!.body;

      const validIds = issueIds.filter((id: string) => mongoose.isValidObjectId(id));
      const issues = await Issue.find({ _id: { $in: validIds } });

      const results: Array<{
        issueId: string;
        success: boolean;
        mlScoring?: MlScoring;
        error?: string;
      }> = [];

      for (const issue of issues) {
        try {
          const mlScoring = await computeScoreViaML({
            title: issue.title,
            body: issue.body,
            labels: issue.labels,
            requiredSkills: issue.requiredSkills,
            beginnerFriendly: issue.beginnerFriendly
          });

          issue.mlScoring = mlScoring;
          await issue.save();

          results.push({
            issueId: issue._id.toString(),
            success: true,
            mlScoring
          });
        } catch (err) {
          results.push({
            issueId: issue._id.toString(),
            success: false,
            error: "Failed to score"
          });
        }
      }

      const successCount = results.filter(r => r.success).length;

      return res.json({
        message: `Scored ${successCount}/${issues.length} issues`,
        results
      });
    } catch (err) {
      console.error("POST /api/ml/score-batch error:", err);
      return res.status(500).json({ message: "Failed to batch score issues" });
    }
  }
);

// POST /api/ml/override/:id - Override ML score
router.post(
  "/override/:id",
  adminRequired,
  validate(overrideScoreSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.validated!.params;
      const { newScore, reason } = req.validated!.body;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid issue ID" });
      }

      const issue = await Issue.findById(id);
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }

      const originalScore = issue.mlScoring?.beginnerScore ?? 0;

      const override: MlOverride = {
        overriddenBy: req.userId!,
        overriddenAt: new Date(),
        originalScore,
        newScore,
        reason
      };

      issue.mlOverride = override;
      await issue.save();

      // Get admin info
      const admin = await User.findById(req.userId).select("login");

      return res.json({
        message: "Score overridden successfully",
        issueId: issue._id,
        override: {
          ...override,
          overriddenByLogin: admin?.login
        }
      });
    } catch (err) {
      console.error("POST /api/ml/override/:id error:", err);
      return res.status(500).json({ message: "Failed to override score" });
    }
  }
);

// DELETE /api/ml/override/:id - Remove override
router.delete(
  "/override/:id",
  adminRequired,
  validate(scoreIssueSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.validated!.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid issue ID" });
      }

      const result = await Issue.findByIdAndUpdate(
        id,
        { $set: { mlOverride: null } },
        { new: true }
      );

      if (!result) {
        return res.status(404).json({ message: "Issue not found" });
      }

      return res.json({
        message: "Override removed",
        issueId: id
      });
    } catch (err) {
      console.error("DELETE /api/ml/override/:id error:", err);
      return res.status(500).json({ message: "Failed to remove override" });
    }
  }
);

// GET /api/ml/issues - List issues with ML scores
router.get(
  "/issues",
  moderatorOrAdminRequired,
  validate(listScoredIssuesSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page, limit, minScore, maxScore, hasOverride, disagreement, search } =
        req.validated!.query;

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const skip = (pageNum - 1) * limitNum;

      const filter: Record<string, any> = {};

      if (minScore) {
        filter["mlScoring.beginnerScore"] = { $gte: parseFloat(minScore) };
      }
      if (maxScore) {
        filter["mlScoring.beginnerScore"] = {
          ...filter["mlScoring.beginnerScore"],
          $lte: parseFloat(maxScore)
        };
      }

      if (hasOverride === "true") {
        filter.mlOverride = { $ne: null };
      } else if (hasOverride === "false") {
        filter.mlOverride = null;
      }

      if (disagreement === "true") {
        // Find where ML score > 0.5 but not beginner-friendly, or vice versa
        filter.$or = [
          { "mlScoring.beginnerScore": { $gte: 0.5 }, beginnerFriendly: false },
          { "mlScoring.beginnerScore": { $lt: 0.5 }, beginnerFriendly: true }
        ];
      }

      if (search && search.trim()) {
        filter.title = { $regex: new RegExp(search.trim(), "i") };
      }

      const [issues, total] = await Promise.all([
        Issue.find(filter)
          .sort({ "mlScoring.beginnerScore": -1 })
          .skip(skip)
          .limit(limitNum)
          .select(
            "_id githubNumber repoOwner repoName title labels " +
            "beginnerFriendly mlScoring mlOverride status githubUrl"
          )
          .lean(),
        Issue.countDocuments(filter)
      ]);

      // Compute effective score (override or ML)
      const issuesWithEffective = issues.map(issue => ({
        ...issue,
        effectiveScore: issue.mlOverride?.newScore ?? issue.mlScoring?.beginnerScore ?? null,
        hasDisagreement: issue.mlScoring
          ? (issue.mlScoring.beginnerScore >= 0.5) !== issue.beginnerFriendly
          : false
      }));

      return res.json({
        issues: issuesWithEffective,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (err) {
      console.error("GET /api/ml/issues error:", err);
      return res.status(500).json({ message: "Failed to load ML-scored issues" });
    }
  }
);

// GET /api/ml/stats - Get ML scoring statistics
router.get(
  "/stats",
  moderatorOrAdminRequired,
  async (_req: AuthRequest, res: Response) => {
    try {
      const [
        totalScored,
        totalUnscored,
        totalOverrides,
        avgScore,
        highScore,
        lowScore,
        disagreements
      ] = await Promise.all([
        Issue.countDocuments({ mlScoring: { $ne: null } }),
        Issue.countDocuments({ mlScoring: null }),
        Issue.countDocuments({ mlOverride: { $ne: null } }),
        Issue.aggregate([
          { $match: { mlScoring: { $ne: null } } },
          { $group: { _id: null, avg: { $avg: "$mlScoring.beginnerScore" } } }
        ]),
        Issue.countDocuments({ "mlScoring.beginnerScore": { $gte: 0.7 } }),
        Issue.countDocuments({ "mlScoring.beginnerScore": { $lt: 0.3 } }),
        Issue.countDocuments({
          $or: [
            { "mlScoring.beginnerScore": { $gte: 0.5 }, beginnerFriendly: false },
            { "mlScoring.beginnerScore": { $lt: 0.5 }, beginnerFriendly: true }
          ]
        })
      ]);

      return res.json({
        totalScored,
        totalUnscored,
        totalOverrides,
        averageScore: avgScore[0]?.avg ?? 0,
        highScoreCount: highScore,
        lowScoreCount: lowScore,
        disagreements,
        scoringCoverage: totalScored / (totalScored + totalUnscored) || 0
      });
    } catch (err) {
      console.error("GET /api/ml/stats error:", err);
      return res.status(500).json({ message: "Failed to load ML stats" });
    }
  }
);

// POST /api/ml/score-all-unscored - Score all unscored issues
router.post(
  "/score-all-unscored",
  adminRequired,
  async (req: AuthRequest, res: Response) => {
    try {
      const maxIssues = 100; // Limit per request

      const issues = await Issue.find({ mlScoring: null })
        .limit(maxIssues)
        .select("_id title body labels requiredSkills beginnerFriendly");

      let scoredCount = 0;
      let failedCount = 0;

      for (const issue of issues) {
        try {
          const mlScoring = await computeScoreViaML({
            title: issue.title,
            body: issue.body,
            labels: issue.labels,
            requiredSkills: issue.requiredSkills,
            beginnerFriendly: issue.beginnerFriendly
          });

          await Issue.findByIdAndUpdate(issue._id, { $set: { mlScoring } });
          scoredCount++;
        } catch (err) {
          failedCount++;
        }
      }

      const remaining = await Issue.countDocuments({ mlScoring: null });

      return res.json({
        message: `Scored ${scoredCount} issues`,
        scoredCount,
        failedCount,
        remaining,
        batchLimit: maxIssues
      });
    } catch (err) {
      console.error("POST /api/ml/score-all-unscored error:", err);
      return res.status(500).json({ message: "Failed to score unscored issues" });
    }
  }
);

export default router;
