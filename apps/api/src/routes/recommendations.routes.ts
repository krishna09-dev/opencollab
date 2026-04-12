import { Router, Response } from "express";
import axios from "axios";
import { AuthRequest, authRequired } from "../middleware/auth";
import { User } from "../models/User";
import { Issue } from "../models/Issue";

const router = Router();

// ML Service URL (FastAPI running on Render in production, localhost in development)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8001";
const MIN_FALLBACK_SIMILARITY = 0.15;
const MAX_FALLBACK_RESULTS = 10;
const FALLBACK_TOP_K = 5;
const RECOMMENDABLE_STATUSES: Array<"open" | "claimed"> = ["open", "claimed"];

function claimedRankForRecommendation(item: { issue_status?: string; claimed_by?: string | null }) {
  return item.issue_status === "claimed" || !!item.claimed_by ? 1 : 0;
}

function sortClaimedToBottom<T extends { issue_status?: string; claimed_by?: string | null }>(items: T[]) {
  return [...items].sort((a, b) => {
    const rankDelta = claimedRankForRecommendation(a) - claimedRankForRecommendation(b);
    if (rankDelta !== 0) return rankDelta;
    return 0;
  });
}

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

  const userLangs = (userProfile.languages || []).map((l) => l.toLowerCase());
  const userTopics = (userProfile.topics || []).map((t) => t.toLowerCase());
  const userDifficulty = (userProfile.difficulty || "beginner").toLowerCase();

  const userKeywords: string[] = [...userTopics];
  userLangs.forEach((lang) => {
    userKeywords.push(lang);
    const variants = languageKeywords[lang];
    if (variants) userKeywords.push(...variants);
  });

  const scored = issues.map((issue: any) => {
    let score = 0;
    const issueText = [
      issue.title,
      ...(issue.labels || []),
      ...(issue.requiredSkills || []),
      issue.repoName,
    ]
      .join(" ")
      .toLowerCase();

    userKeywords.forEach((kw) => {
      if (issueText.includes(kw)) score += 2;
    });

    const isBeginnerIssue =
      issue.beginnerFriendly ||
      (issue.labels || []).some((l: string) => {
        const normalized = l.toLowerCase();
        return (
          normalized.includes("good first") ||
          normalized.includes("beginner") ||
          normalized.includes("easy")
        );
      });

    if (userDifficulty === "beginner" && isBeginnerIssue) {
      score += 5;
    } else if (userDifficulty === "intermediate" && !isBeginnerIssue) {
      score += 2;
    } else if (userDifficulty === "advanced") {
      score += 1;
    }

    let language = "Unknown";
    for (const [lang, keywords] of Object.entries(languageKeywords)) {
      if (keywords.some((kw) => issueText.includes(kw))) {
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
      summary: issue.summary || issue.body?.slice(0, 200) || "",
      claimed_by: issue.claimedByLogin || null,
      issue_status: issue.status || "open",
      _score: score,
      _claimedRank: issue.status === "claimed" ? 1 : 0,
    };
  });

  scored.sort((a, b) => {
    if (a._claimedRank !== b._claimedRank) return a._claimedRank - b._claimedRank;
    return b._score - a._score;
  });

  const aboveThreshold = scored.filter(
    (item) => item.similarity_score >= MIN_FALLBACK_SIMILARITY
  );

  const candidatePool =
    aboveThreshold.length >= FALLBACK_TOP_K ? aboveThreshold : scored.slice(0, FALLBACK_TOP_K);

  const maxResults = Math.min(topN, MAX_FALLBACK_RESULTS);
  const repoCount: Record<string, number> = {};

  const diverse = candidatePool
    .filter((item) => {
      const count = repoCount[item.repo_name] || 0;
      if (count >= 5) return false;
      repoCount[item.repo_name] = count + 1;
      return true;
    })
    .slice(0, maxResults);

  return sortClaimedToBottom(diverse).map(({ _score, _claimedRank, ...rest }) => rest);
}

/**
 * Fetch recommendable issues from the database and format for ML service.
 */
async function fetchDatabaseIssues() {
  const issues = await Issue.find({ status: { $in: RECOMMENDABLE_STATUSES } })
    .select(
      "_id repoOwner repoName title body summary labels requiredSkills beginnerFriendly status claimedByLogin"
    )
    .limit(100)
    .lean();

  return issues.map((issue: any) => ({
    id: issue._id.toString(),
    repoOwner: issue.repoOwner || "",
    repoName: issue.repoName || "",
    title: issue.title || "",
    body: issue.body || "",
    summary: issue.summary || "",
    labels: issue.labels || [],
    requiredSkills: issue.requiredSkills || [],
    beginnerFriendly: issue.beginnerFriendly || false,
    status: issue.status || "open",
    claimedByLogin: issue.claimedByLogin || null,
  }));
}

router.get("/", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    const { top_n = "10" } = req.query as Record<string, string | undefined>;
    const topN = Math.min(50, Math.max(1, parseInt(top_n, 10) || 10));

    const user = await User.findById(req.userId).select(
      "preferredLanguages experienceLevel areasOfInterest"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const databaseIssues = await fetchDatabaseIssues();

    if (databaseIssues.length === 0) {
      return res.json({
        recommendations: [],
        method: "no-issues",
        userProfile: {},
        message: "No recommendable issues found in the database",
      });
    }

    const userProfile = {
      languages: user.preferredLanguages || [],
      difficulty: user.experienceLevel || "beginner",
      topics: user.areasOfInterest || [],
      keywords: [],
    };

    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}/recommend`,
      {
        user: userProfile,
        issues: databaseIssues,
        top_n: topN,
      },
      { timeout: 30000 }
    );

    const issueMetaById = new Map(
      databaseIssues.map((issue: any) => [
        issue.id,
        {
          issue_status: issue.status || "open",
          claimed_by: issue.claimedByLogin || null,
        },
      ])
    );

    const recommendationsWithClaimState = sortClaimedToBottom(
      (mlResponse.data.recommendations || []).map((item: any) => {
        const issueMeta = issueMetaById.get(item.issue_id) || {
          issue_status: "open",
          claimed_by: null,
        };

        return {
          ...item,
          issue_status: issueMeta.issue_status,
          claimed_by: issueMeta.claimed_by,
        };
      })
    );

    return res.json({
      recommendations: recommendationsWithClaimState,
      method: mlResponse.data.method,
      userProfile,
      totalIssuesAnalyzed: mlResponse.data.total_issues_analyzed,
    });
  } catch (err: any) {
    console.error("GET /api/recommendations error:", {
      message: err?.message,
      code: err?.code,
      status: err?.response?.status,
      data: err?.response?.data,
    });

    const shouldUseFallback =
      err?.code === "ECONNREFUSED" ||
      err?.code === "ETIMEDOUT" ||
      err?.code === "ECONNABORTED" ||
      err?.code === "ERR_BAD_RESPONSE" ||
      [404, 422, 429, 500, 502, 503, 504].includes(err?.response?.status);

    if (shouldUseFallback) {
      try {
        const user = await User.findById(req.userId).select(
          "preferredLanguages experienceLevel areasOfInterest"
        );
        const databaseIssues = await fetchDatabaseIssues();
        const { top_n = "10" } = req.query as Record<string, string | undefined>;
        const topN = Math.min(50, Math.max(1, parseInt(top_n, 10) || 10));

        const userProfile = {
          languages: user?.preferredLanguages || [],
          difficulty: user?.experienceLevel || "beginner",
          topics: user?.areasOfInterest || [],
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
          note: "Using fallback recommendations (ML service unavailable)",
        });
      } catch (fallbackErr) {
        console.error("Fallback recommendations failed:", fallbackErr);
        return res.json({
          recommendations: [],
          method: "fallback-failed",
          userProfile: {},
          error: "ML service unavailable and fallback failed",
        });
      }
    }

    return res.status(500).json({
      message: "Failed to get recommendations",
      error: err?.message,
      mlStatus: err?.response?.status,
    });
  }
});

router.get("/health", async (_req, res: Response) => {
  try {
    const mlResponse = await axios.get(`${ML_SERVICE_URL}/health`, {
      timeout: 5000,
    });

    const issueCount = await Issue.countDocuments({ status: { $in: RECOMMENDABLE_STATUSES } });

    return res.json({
      status: "ok",
      mlService: mlResponse.data,
      database: {
        status: "connected",
        openAndClaimedIssues: issueCount,
      },
    });
  } catch (err: any) {
    return res.json({
      status: "degraded",
      mlService: {
        status: "unavailable",
        error: err?.message,
      },
    });
  }
});

router.post("/custom", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    const { languages, difficulty, topics, keywords, top_n } = req.body;

    const userProfile = {
      languages: languages || [],
      difficulty: difficulty || "beginner",
      topics: topics || [],
      keywords: keywords || [],
    };

    const topN = Math.min(50, Math.max(1, parseInt(top_n, 10) || 10));
    const databaseIssues = await fetchDatabaseIssues();

    if (databaseIssues.length === 0) {
      return res.json({
        recommendations: [],
        method: "no-issues",
        userProfile,
        message: "No recommendable issues found in the database",
      });
    }

    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}/recommend`,
      {
        user: userProfile,
        issues: databaseIssues,
        top_n: topN,
      },
      { timeout: 30000 }
    );

    const issueMetaById = new Map(
      databaseIssues.map((issue: any) => [
        issue.id,
        {
          issue_status: issue.status || "open",
          claimed_by: issue.claimedByLogin || null,
        },
      ])
    );

    const recommendationsWithClaimState = sortClaimedToBottom(
      (mlResponse.data.recommendations || []).map((item: any) => {
        const issueMeta = issueMetaById.get(item.issue_id) || {
          issue_status: "open",
          claimed_by: null,
        };

        return {
          ...item,
          issue_status: issueMeta.issue_status,
          claimed_by: issueMeta.claimed_by,
        };
      })
    );

    return res.json({
      recommendations: recommendationsWithClaimState,
      method: mlResponse.data.method,
      userProfile,
      totalIssuesAnalyzed: mlResponse.data.total_issues_analyzed,
    });
  } catch (err: any) {
    console.error("POST /api/recommendations/custom error:", {
      message: err?.message,
      code: err?.code,
      status: err?.response?.status,
      data: err?.response?.data,
    });

    const shouldUseFallback =
      err?.code === "ECONNREFUSED" ||
      err?.code === "ETIMEDOUT" ||
      err?.code === "ECONNABORTED" ||
      err?.code === "ERR_BAD_RESPONSE" ||
      [404, 422, 429, 500, 502, 503, 504].includes(err?.response?.status);

    if (shouldUseFallback) {
      return res.json({
        recommendations: [],
        method: "fallback",
        userProfile: {},
        error: "ML service unavailable or returned an invalid response",
      });
    }

    return res.status(500).json({
      message: "Failed to get recommendations",
      error: err?.message,
      mlStatus: err?.response?.status,
    });
  }
});

export default router;