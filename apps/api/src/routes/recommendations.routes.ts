import { Router, Response } from "express";
import axios from "axios";
import { AuthRequest, authRequired } from "../middleware/auth";
import { User } from "../models/User";
import { Issue } from "../models/Issue";

const router = Router();

// ML Service URL (FastAPI running on port 8001)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8001";

/**
 * Simple fallback recommendation when ML service is unavailable.
 * Uses keyword matching on labels, skills, and difficulty.
 */
function computeFallbackRecommendations(
  issues: any[],
  userProfile: { languages: string[]; difficulty: string; topics: string[] },
  topN: number
) {
  const languageKeywords: Record<string, string[]> = {
    javascript: ["javascript", "js", "react", "node", "vue", "angular", "typescript", "ts"],
    typescript: ["typescript", "ts", "angular", "react"],
    python: ["python", "django", "flask", "fastapi", "py"],
    java: ["java", "spring", "maven", "gradle"],
    go: ["go", "golang"],
    rust: ["rust", "cargo"],
    ruby: ["ruby", "rails"],
  };

  const userLangs = (userProfile.languages || []).map(l => l.toLowerCase());
  const userTopics = (userProfile.topics || []).map(t => t.toLowerCase());
  const userDifficulty = (userProfile.difficulty || "beginner").toLowerCase();

  // Build user keywords
  const userKeywords: string[] = [...userTopics];
  userLangs.forEach(lang => {
    userKeywords.push(lang);
    const variants = languageKeywords[lang];
    if (variants) userKeywords.push(...variants);
  });

  // Score each issue
  const scored = issues.map((issue: any) => {
    let score = 0;
    const issueText = [
      issue.title,
      ...(issue.labels || []),
      ...(issue.requiredSkills || []),
      issue.repoName
    ].join(" ").toLowerCase();

    // Match user keywords
    userKeywords.forEach(kw => {
      if (issueText.includes(kw)) score += 2;
    });

    // Difficulty matching
    const isBeginnerIssue = issue.beginnerFriendly ||
      (issue.labels || []).some((l: string) =>
        l.toLowerCase().includes("good first") ||
        l.toLowerCase().includes("beginner") ||
        l.toLowerCase().includes("easy")
      );

    if (userDifficulty === "beginner" && isBeginnerIssue) {
      score += 5;
    } else if (userDifficulty === "intermediate" && !isBeginnerIssue) {
      score += 2;
    } else if (userDifficulty === "advanced") {
      score += 1;
    }

    // Infer language from issue
    let language = "Unknown";
    for (const [lang, keywords] of Object.entries(languageKeywords)) {
      if (keywords.some(kw => issueText.includes(kw))) {
        language = lang.charAt(0).toUpperCase() + lang.slice(1);
        break;
      }
    }

    return {
      issue_id: issue.id,
      repo_name: `${issue.repoOwner}/${issue.repoName}`,
      issue_title: issue.title,
      language,
      difficulty: isBeginnerIssue ? "beginner" : "intermediate",
      labels: (issue.labels || []).slice(0, 5).join(", "),
      topics: (issue.requiredSkills || []).slice(0, 5).join(", "),
      similarity_score: Math.min(1, score / 10),
      _score: score
    };
  });

  // Sort by score and take top N
  scored.sort((a, b) => b._score - a._score);

  // Diversify - max 3 per repo
  const repoCount: Record<string, number> = {};
  const diverse = scored.filter(item => {
    const count = repoCount[item.repo_name] || 0;
    if (count >= 3) return false;
    repoCount[item.repo_name] = count + 1;
    return true;
  }).slice(0, topN);

  // Remove internal score field
  return diverse.map(({ _score, ...rest }) => rest);
}

/**
 * Fetch open issues from the database and format for ML service.
 */
async function fetchDatabaseIssues() {
  // Fetch all open issues from MongoDB
  const issues = await Issue.find({ status: "open" })
    .select(
      "_id repoOwner repoName title body labels requiredSkills beginnerFriendly"
    )
    .limit(500) // Limit for performance
    .lean();

  // Format for ML service
  return issues.map((issue: any) => ({
    id: issue._id.toString(),
    repoOwner: issue.repoOwner || "",
    repoName: issue.repoName || "",
    title: issue.title || "",
    body: issue.body || "",
    labels: issue.labels || [],
    requiredSkills: issue.requiredSkills || [],
    beginnerFriendly: issue.beginnerFriendly || false
  }));
}

/**
 * GET /api/recommendations
 * Get personalized issue recommendations for the authenticated user.
 * Uses REAL issues from the MongoDB database, not CSV or seed data.
 */
router.get("/", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    const { top_n = "10" } = req.query as Record<string, string | undefined>;
    const topN = Math.min(50, Math.max(1, parseInt(top_n, 10) || 10));

    // Get user preferences
    const user = await User.findById(req.userId).select(
      "preferredLanguages experienceLevel areasOfInterest"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch REAL issues from database
    const databaseIssues = await fetchDatabaseIssues();

    if (databaseIssues.length === 0) {
      return res.json({
        recommendations: [],
        method: "no-issues",
        userProfile: {},
        message: "No open issues found in the database"
      });
    }

    // Build user profile for ML service
    const userProfile = {
      languages: user.preferredLanguages || [],
      difficulty: user.experienceLevel || "beginner",
      topics: user.areasOfInterest || [],
      keywords: []
    };

    // Call ML service with real database issues
    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}/recommend`,
      {
        user: userProfile,
        issues: databaseIssues,
        top_n: topN
      },
      { timeout: 30000 }
    );

    return res.json({
      recommendations: mlResponse.data.recommendations,
      method: mlResponse.data.method,
      userProfile: userProfile,
      totalIssuesAnalyzed: mlResponse.data.total_issues_analyzed
    });
  } catch (err: any) {
    console.error("GET /api/recommendations error:", err?.message || err);

    // If ML service is unavailable, use fallback recommendations
    if (err?.code === "ECONNREFUSED" || err?.code === "ETIMEDOUT") {
      try {
        // Re-fetch user profile and issues for fallback
        const user = await User.findById(req.userId).select(
          "preferredLanguages experienceLevel areasOfInterest"
        );
        const databaseIssues = await fetchDatabaseIssues();
        const { top_n = "10" } = req.query as Record<string, string | undefined>;
        const topN = Math.min(50, Math.max(1, parseInt(top_n, 10) || 10));

        const userProfile = {
          languages: user?.preferredLanguages || [],
          difficulty: user?.experienceLevel || "beginner",
          topics: user?.areasOfInterest || []
        };

        const recommendations = computeFallbackRecommendations(
          databaseIssues,
          userProfile,
          topN
        );

        return res.json({
          recommendations,
          method: "fallback-keyword",
          userProfile,
          totalIssuesAnalyzed: databaseIssues.length,
          note: "Using fallback recommendations (ML service unavailable)"
        });
      } catch (fallbackErr) {
        console.error("Fallback recommendations failed:", fallbackErr);
        return res.json({
          recommendations: [],
          method: "fallback-failed",
          userProfile: {},
          error: "ML service unavailable and fallback failed"
        });
      }
    }

    return res.status(500).json({
      message: "Failed to get recommendations",
      error: err?.message
    });
  }
});

/**
 * GET /api/recommendations/health
 * Check ML service health.
 */
router.get("/health", async (_req, res: Response) => {
  try {
    const mlResponse = await axios.get(`${ML_SERVICE_URL}/health`, {
      timeout: 5000
    });

    // Also check database connection
    const issueCount = await Issue.countDocuments({ status: "open" });

    return res.json({
      status: "ok",
      mlService: mlResponse.data,
      database: {
        status: "connected",
        openIssues: issueCount
      }
    });
  } catch (err: any) {
    return res.json({
      status: "degraded",
      mlService: {
        status: "unavailable",
        error: err?.message
      }
    });
  }
});

/**
 * POST /api/recommendations/custom
 * Get recommendations with a custom profile (for testing/preview).
 * Uses REAL database issues.
 */
router.post("/custom", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    const { languages, difficulty, topics, keywords, top_n } = req.body;

    const userProfile = {
      languages: languages || [],
      difficulty: difficulty || "beginner",
      topics: topics || [],
      keywords: keywords || []
    };

    const topN = Math.min(50, Math.max(1, parseInt(top_n, 10) || 10));

    // Fetch REAL issues from database
    const databaseIssues = await fetchDatabaseIssues();

    if (databaseIssues.length === 0) {
      return res.json({
        recommendations: [],
        method: "no-issues",
        userProfile: userProfile,
        message: "No open issues found in the database"
      });
    }

    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}/recommend`,
      {
        user: userProfile,
        issues: databaseIssues,
        top_n: topN
      },
      { timeout: 30000 }
    );

    return res.json({
      recommendations: mlResponse.data.recommendations,
      method: mlResponse.data.method,
      userProfile: userProfile,
      totalIssuesAnalyzed: mlResponse.data.total_issues_analyzed
    });
  } catch (err: any) {
    console.error("POST /api/recommendations/custom error:", err?.message || err);

    if (err?.code === "ECONNREFUSED" || err?.code === "ETIMEDOUT") {
      return res.json({
        recommendations: [],
        method: "fallback",
        userProfile: {},
        error: "ML service unavailable"
      });
    }

    return res.status(500).json({
      message: "Failed to get recommendations",
      error: err?.message
    });
  }
});

export default router;
