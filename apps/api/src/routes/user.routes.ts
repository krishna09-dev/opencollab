// apps/api/src/routes/user.routes.ts
import { Router, Response } from "express";
import { AuthRequest, authRequired } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  updatePreferencesSchema,
  updateProfileSchema,
  saveIssueSchema,
  unsaveIssueSchema,
  listMyClaimedIssuesSchema,
  addRecentSearchSchema
} from "../validators/user.validator";
import { User } from "../models/User";
import { Issue } from "../models/Issue";
import { PrTracking } from "../models/PrTracking";
import { fetchGitHubStats, fetchContributionData } from "../services/githubStats.service";
import { fetchOpenCollabContributionData } from "../services/openCollabContributions.service";

const router = Router();

type ContributionSource = "open-collab" | "github";
type ProfileActivityType = "issue_claimed" | "pr_opened" | "pr_merged" | "pr_closed";
type IssuePrStatus = "NONE" | "PR_OPEN" | "MERGED" | "CLOSED";
type TrackingPrStatus = "ACCEPTED" | "PR_OPEN" | "MERGED" | "CLOSED";

interface ProfileActivityItem {
  id: string;
  type: ProfileActivityType;
  title: string;
  description: string;
  at: Date;
  url: string | null;
}

function parseContributionSource(raw: unknown): ContributionSource {
  return raw === "github" ? "github" : "open-collab";
}

function clampLimit(raw: unknown, fallback = 5, min = 1, max = 20): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

const issuePrStatusPriority: Record<IssuePrStatus, number> = {
  NONE: 0,
  CLOSED: 1,
  PR_OPEN: 2,
  MERGED: 3
};

function mapTrackingPrStatusToIssuePrStatus(status: TrackingPrStatus | null | undefined): IssuePrStatus {
  if (status === "PR_OPEN") return "PR_OPEN";
  if (status === "MERGED") return "MERGED";
  if (status === "CLOSED") return "CLOSED";
  return "NONE";
}

function buildRepoIssueKey(repoOwner: string, repoName: string, issueNumber: number): string {
  return `${repoOwner}/${repoName}`.toLowerCase() + `#${issueNumber}`;
}

// GET /api/me
router.get("/me", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select("-__v");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      id: user._id,
      login: user.login,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
      preferredLanguages: user.preferredLanguages,
      experienceLevel: user.experienceLevel,
      areasOfInterest: user.areasOfInterest,
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error("GET /me error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/me/claimed-issues - List issues claimed by current user
router.get(
  "/me/claimed-issues",
  authRequired,
  validate(listMyClaimedIssuesSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page, limit, search, status } = req.validated!.query;

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
      const skip = (pageNum - 1) * limitNum;

      // Backfill stale records that were kept as claimed even after GitHub closure.
      await Issue.updateMany(
        {
          claimedByUserId: req.userId,
          status: "claimed",
          $or: [
            { prStatus: "MERGED" },
            {
              updates: {
                $elemMatch: {
                  $or: [
                    { id: { $regex: /^gh_closed_/ } },
                    {
                      actorRole: "GITHUB",
                      body: { $regex: /(closed this issue|issue has been closed)/i }
                    }
                  ]
                }
              }
            }
          ]
        },
        { $set: { status: "closed" } }
      );

      const filter: Record<string, unknown> = {
        claimedByUserId: req.userId,
        isApproved: true,
        isVisible: true
      };

      if (status === "claimed" || status === "closed") {
        filter.status = status;
      }

      if (search && search.trim()) {
        const s = search.trim();
        filter.$or = [
          { title: { $regex: new RegExp(s, "i") } },
          { repoOwner: { $regex: new RegExp(s, "i") } },
          { repoName: { $regex: new RegExp(s, "i") } },
          { summary: { $regex: new RegExp(s, "i") } }
        ];
      }

      const [issues, total] = await Promise.all([
        Issue.find(filter)
          .sort({ status: 1, claimedAt: -1, githubUpdatedAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .select(
            "_id githubNumber repoOwner repoName repoLanguage title body summary labels status " +
            "claimedAt claimedByLogin githubUrl prStatus githubCreatedAt githubUpdatedAt updates"
          ),
        Issue.countDocuments(filter)
      ]);

      type PrStatusCandidate = {
        issueId?: unknown;
        repoFullName?: string | null;
        issueNumber?: number | null;
        status?: TrackingPrStatus | null;
      };

      const issueIds = issues.map((issue) => issue._id);
      const issueNumbers = Array.from(new Set(
        issues
          .map((issue) => issue.githubNumber)
          .filter((n): n is number => Number.isFinite(n))
      ));

      const trackingOrFilters: Record<string, unknown>[] = [];
      if (issueIds.length > 0) {
        trackingOrFilters.push({ issueId: { $in: issueIds } });
      }
      if (issueNumbers.length > 0) {
        trackingOrFilters.push({ issueNumber: { $in: issueNumbers } });
      }

      const trackingCandidatesRaw = trackingOrFilters.length > 0
        ? await PrTracking.find({
          userId: req.userId,
          $or: trackingOrFilters
        })
          .sort({ updatedAt: -1 })
          .select("issueId repoFullName issueNumber status")
          .lean()
        : [];

      const trackingCandidates = trackingCandidatesRaw as PrStatusCandidate[];
      const trackingByIssueId = new Map<string, IssuePrStatus>();
      const trackingByRepoIssue = new Map<string, IssuePrStatus>();

      for (const candidate of trackingCandidates) {
        const mappedStatus = mapTrackingPrStatusToIssuePrStatus(candidate.status);
        if (mappedStatus === "NONE") continue;

        if (candidate.issueId) {
          const issueIdKey = String(candidate.issueId);
          const existing = trackingByIssueId.get(issueIdKey) || "NONE";
          if (issuePrStatusPriority[mappedStatus] > issuePrStatusPriority[existing]) {
            trackingByIssueId.set(issueIdKey, mappedStatus);
          }
        }

        if (typeof candidate.issueNumber === "number" && candidate.repoFullName) {
          const repoIssueKey = `${String(candidate.repoFullName).toLowerCase()}#${candidate.issueNumber}`;
          const existing = trackingByRepoIssue.get(repoIssueKey) || "NONE";
          if (issuePrStatusPriority[mappedStatus] > issuePrStatusPriority[existing]) {
            trackingByRepoIssue.set(repoIssueKey, mappedStatus);
          }
        }
      }

      const issuesWithCounts = issues.map((issue) => {
        const obj: any = issue.toObject();
        const issueIdKey = String(obj._id);
        const issueNumber = Number(obj.githubNumber);
        const repoIssueKey = Number.isFinite(issueNumber)
          ? buildRepoIssueKey(String(obj.repoOwner || ""), String(obj.repoName || ""), issueNumber)
          : null;
        const fallbackPrStatus = trackingByIssueId.get(issueIdKey)
          || (repoIssueKey ? trackingByRepoIssue.get(repoIssueKey) : undefined)
          || "NONE";

        if ((!obj.prStatus || obj.prStatus === "NONE") && fallbackPrStatus !== "NONE") {
          obj.prStatus = fallbackPrStatus;
        }

        obj.commentsCount = (obj.updates || []).filter(
          (u: any) => u.id && u.id.startsWith("gh_")
        ).length;
        delete obj.updates;
        return obj;
      });

      return res.json({
        issues: issuesWithCounts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (err) {
      console.error("GET /api/me/claimed-issues error:", err);
      return res.status(500).json({ message: "Failed to load claimed issues" });
    }
  }
);

// PUT /api/me/preferences (onboarding)
router.put(
  "/me/preferences",
  authRequired,
  validate(updatePreferencesSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { preferredLanguages, experienceLevel, areasOfInterest } = req.validated!.body;

      const user = await User.findByIdAndUpdate(
        req.userId,
        {
          preferredLanguages,
          experienceLevel,
          areasOfInterest
        },
        { new: true }
      ).select("-__v");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json({
        message: "Preferences updated",
        user
      });
    } catch (err) {
      console.error("PUT /me/preferences error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// PUT /api/me/profile - Update full user profile
router.put(
  "/me/profile",
  authRequired,
  validate(updateProfileSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { email, preferredLanguages, experienceLevel, areasOfInterest } = req.validated!.body;

      const updateData: Record<string, unknown> = {};
      if (email !== undefined) updateData.email = email;
      if (preferredLanguages !== undefined) updateData.preferredLanguages = preferredLanguages;
      if (experienceLevel !== undefined) updateData.experienceLevel = experienceLevel;
      if (areasOfInterest !== undefined) updateData.areasOfInterest = areasOfInterest;

      const user = await User.findByIdAndUpdate(
        req.userId,
        updateData,
        { new: true }
      ).select("-__v -githubAccessToken");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json({
        id: user._id,
        login: user.login,
        email: user.email,
        avatarUrl: user.avatarUrl,
        preferredLanguages: user.preferredLanguages,
        experienceLevel: user.experienceLevel,
        areasOfInterest: user.areasOfInterest,
        createdAt: user.createdAt
      });
    } catch (err) {
      console.error("PUT /me/profile error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// GET /api/me/saved-issues - Get all saved issues
router.get("/me/saved-issues", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select("savedIssues");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({ savedIssues: user.savedIssues || [] });
  } catch (err) {
    console.error("GET /me/saved-issues error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /api/me/saved-issues - Save an issue
router.post(
  "/me/saved-issues",
  authRequired,
  validate(saveIssueSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { issueId, title, repoOwner, repoName, repoLanguage, labels, beginnerFriendly } = req.validated!.body;

      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if already saved
      const alreadySaved = user.savedIssues.some((s) => s.issueId === issueId);
      if (alreadySaved) {
        return res.status(400).json({ message: "Issue already saved" });
      }

      user.savedIssues.push({
        issueId,
        title,
        repoOwner,
        repoName,
        repoLanguage: repoLanguage || null,
        labels: labels || [],
        beginnerFriendly: beginnerFriendly || false,
        savedAt: new Date()
      });
      await user.save();

      return res.status(201).json({ message: "Issue saved", savedIssues: user.savedIssues });
    } catch (err) {
      console.error("POST /me/saved-issues error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// DELETE /api/me/saved-issues/:issueId - Unsave an issue
router.delete(
  "/me/saved-issues/:issueId",
  authRequired,
  validate(unsaveIssueSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { issueId } = req.validated!.params;

      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const initialLength = user.savedIssues.length;
      user.savedIssues = user.savedIssues.filter((s) => s.issueId !== issueId);

      if (user.savedIssues.length === initialLength) {
        return res.status(404).json({ message: "Issue not found in saved list" });
      }

      await user.save();
      return res.json({ message: "Issue unsaved", savedIssues: user.savedIssues });
    } catch (err) {
      console.error("DELETE /me/saved-issues error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// GET /api/me/recent-searches - Get recent searches
router.get("/me/recent-searches", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select("recentSearches");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({ recentSearches: user.recentSearches || [] });
  } catch (err) {
    console.error("GET /me/recent-searches error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /api/me/recent-searches - Add a recent search
router.post(
  "/me/recent-searches",
  authRequired,
  validate(addRecentSearchSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { query } = req.validated!.body;
      const trimmedQuery = query.trim();

      if (!trimmedQuery) {
        return res.status(400).json({ message: "Search query cannot be empty" });
      }

      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove if already exists (to move it to front)
      user.recentSearches = user.recentSearches.filter(
        (s) => s.toLowerCase() !== trimmedQuery.toLowerCase()
      );

      // Add to front
      user.recentSearches.unshift(trimmedQuery);

      // Keep only last 3
      user.recentSearches = user.recentSearches.slice(0, 3);

      await user.save();
      return res.json({ recentSearches: user.recentSearches });
    } catch (err) {
      console.error("POST /me/recent-searches error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// GET /api/me/github-stats - Get GitHub activity stats
router.get("/me/github-stats", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select("login githubAccessToken");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.githubAccessToken) {
      return res.status(400).json({ message: "GitHub access token not available" });
    }

    const stats = await fetchGitHubStats(user.githubAccessToken, user.login);
    return res.json(stats);
  } catch (err) {
    console.error("GET /me/github-stats error:", err);
    return res.status(500).json({ message: "Failed to fetch GitHub stats" });
  }
});

// GET /api/me/contributions?source=open-collab|github
router.get("/me/contributions", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    const source = parseContributionSource(req.query.source);
    const user = await User.findById(req.userId).select("_id login githubAccessToken");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (source === "github") {
      if (!user.githubAccessToken) {
        return res.status(400).json({ message: "GitHub access token not available", source });
      }

      const githubContributions = await fetchContributionData(user.githubAccessToken, user.login);
      return res.json({
        source,
        totalContributions: githubContributions.totalContributions,
        weeks: githubContributions.weeks
      });
    }

    const openCollabContributions = await fetchOpenCollabContributionData(String(user._id));
    return res.json({
      source,
      totalContributions: openCollabContributions.totalContributions,
      weeks: openCollabContributions.weeks
    });
  } catch (err) {
    console.error("GET /me/contributions error:", err);
    return res.status(500).json({ message: "Failed to fetch contribution data" });
  }
});

// GET /api/me/recent-activities?limit=5
router.get("/me/recent-activities", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    const limit = clampLimit(req.query.limit, 5, 1, 20);

    const user = await User.findById(req.userId).select("_id");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const [claimedIssues, prTrackings] = await Promise.all([
      Issue.find({
        claimedByUserId: req.userId,
        claimedAt: { $ne: null },
        isApproved: true,
        isVisible: true
      })
        .sort({ claimedAt: -1 })
        .limit(limit * 2)
        .select("_id githubNumber repoOwner repoName title githubUrl claimedAt")
        .lean(),
      PrTracking.find({ userId: user._id })
        .sort({ updatedAt: -1 })
        .limit(limit * 4)
        .select("_id repoFullName prNumber prTitle prUrl createdAt mergedAt mergedAtGithub closedAt status")
        .lean()
    ]);

    const activities: ProfileActivityItem[] = [];

    for (const issue of claimedIssues) {
      if (!issue.claimedAt) continue;

      activities.push({
        id: `issue-claimed:${String(issue._id)}`,
        type: "issue_claimed",
        title: `Claimed issue #${issue.githubNumber}`,
        description: `${issue.repoOwner}/${issue.repoName} - ${issue.title}`,
        at: issue.claimedAt,
        url: issue.githubUrl || null
      });
    }

    for (const pr of prTrackings) {
      const prLabel = pr.prNumber ? `#${pr.prNumber}` : "PR";
      const description = pr.prTitle?.trim()
        ? `${pr.repoFullName} - ${pr.prTitle.trim()}`
        : pr.repoFullName;

      if (pr.prUrl && pr.createdAt) {
        activities.push({
          id: `pr-opened:${String(pr._id)}:${new Date(pr.createdAt).toISOString()}`,
          type: "pr_opened",
          title: `Opened PR ${prLabel}`,
          description,
          at: pr.createdAt,
          url: pr.prUrl
        });
      }

      const mergedAt = pr.mergedAtGithub || pr.mergedAt;
      if (mergedAt) {
        activities.push({
          id: `pr-merged:${String(pr._id)}:${new Date(mergedAt).toISOString()}`,
          type: "pr_merged",
          title: `Merged PR ${prLabel}`,
          description,
          at: mergedAt,
          url: pr.prUrl || null
        });
      }

      if (pr.status === "CLOSED" && pr.closedAt && !mergedAt) {
        activities.push({
          id: `pr-closed:${String(pr._id)}:${new Date(pr.closedAt).toISOString()}`,
          type: "pr_closed",
          title: `Closed PR ${prLabel}`,
          description,
          at: pr.closedAt,
          url: pr.prUrl || null
        });
      }
    }

    activities.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    return res.json({
      activities: activities.slice(0, limit)
    });
  } catch (err) {
    console.error("GET /api/me/recent-activities error:", err);
    return res.status(500).json({ message: "Failed to load recent activities" });
  }
});

export default router;
