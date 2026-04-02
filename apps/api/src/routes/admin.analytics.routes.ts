import { Router, Response } from "express";
import { AuthRequest, authRequired } from "../middleware/auth";
import { moderatorOrAdminRequired } from "../middleware/adminAuth";
import { User } from "../models/User";
import { Issue } from "../models/Issue";
import { PrTracking } from "../models/PrTracking";
import { Report } from "../models/Report";
import { ApprovedRepo } from "../models/ApprovedRepo";
import {
  applyIssueRepoScope,
  applyRepoFullNameScope,
  getModerationScope
} from "../services/moderationScope.service";

const router = Router();

router.use(authRequired);
router.use(moderatorOrAdminRequired);

// GET /api/admin/analytics - Platform analytics overview
router.get("/analytics", async (req: AuthRequest, res: Response) => {
  try {
    const scope = await getModerationScope(req.userId!);
    if (!scope) {
      return res.status(403).json({ message: "Admin or moderator access required" });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const issueScopeFilter: Record<string, any> = {};
    applyIssueRepoScope(issueScopeFilter, scope);

    const prScopeFilter: Record<string, any> = {};
    applyRepoFullNameScope(prScopeFilter, scope);

    const prSubmittedScopeFilter: Record<string, any> = {
      prUrl: { $ne: null }
    };
    applyRepoFullNameScope(prSubmittedScopeFilter, scope);

    // ==================== USER METRICS ====================
    let totalUsers = 0;
    let newUsersLast30Days = 0;
    let usersWithClaims = 0;
    let usersWithPrs = 0;

    if (scope.isAdmin) {
      [totalUsers, newUsersLast30Days, usersWithClaims, usersWithPrs] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        Issue.distinct("claimedByUserId", { status: "claimed" }).then((ids) =>
          ids.filter((id) => id).length
        ),
        PrTracking.distinct("userId").then((ids) => ids.length)
      ]);
    } else {
      const [claimUserIdsRaw, prUserIdsRaw] = await Promise.all([
        Issue.distinct("claimedByUserId", {
          ...issueScopeFilter,
          status: "claimed",
          claimedByUserId: { $ne: null }
        }),
        PrTracking.distinct("userId", { ...prSubmittedScopeFilter })
      ]);

      const claimUserIds = Array.from(
        new Set(claimUserIdsRaw.filter((id) => id).map((id) => String(id)))
      );
      const prUserIds = Array.from(
        new Set(prUserIdsRaw.filter((id) => id).map((id) => String(id)))
      );
      const scopedUserIds = Array.from(new Set([...claimUserIds, ...prUserIds]));

      totalUsers = scopedUserIds.length;
      usersWithClaims = claimUserIds.length;
      usersWithPrs = prUserIds.length;

      if (scopedUserIds.length > 0) {
        newUsersLast30Days = await User.countDocuments({
          _id: { $in: scopedUserIds },
          createdAt: { $gte: thirtyDaysAgo }
        });
      }
    }

    // ==================== ISSUE METRICS ====================
    const [
      totalIssues,
      openIssues,
      claimedIssues,
      closedIssues,
      approvedIssues,
      visibleIssues,
      beginnerFriendlyIssues,
      issuesLast30Days
    ] = await Promise.all([
      Issue.countDocuments({ ...issueScopeFilter }),
      Issue.countDocuments({ ...issueScopeFilter, status: "open" }),
      Issue.countDocuments({ ...issueScopeFilter, status: "claimed" }),
      Issue.countDocuments({ ...issueScopeFilter, status: "closed" }),
      Issue.countDocuments({ ...issueScopeFilter, isApproved: true }),
      Issue.countDocuments({ ...issueScopeFilter, isVisible: true }),
      Issue.countDocuments({ ...issueScopeFilter, beginnerFriendly: true }),
      Issue.countDocuments({ ...issueScopeFilter, githubCreatedAt: { $gte: thirtyDaysAgo } })
    ]);

    // ==================== PR METRICS ====================
    const [totalPrs, openPrs, mergedPrs, closedPrs, prsLast30Days, prsLast7Days] =
      await Promise.all([
        PrTracking.countDocuments({ ...prSubmittedScopeFilter }),
        PrTracking.countDocuments({ ...prScopeFilter, status: "PR_OPEN" }),
        PrTracking.countDocuments({ ...prScopeFilter, status: "MERGED" }),
        PrTracking.countDocuments({ ...prScopeFilter, status: "CLOSED" }),
        PrTracking.countDocuments({
          ...prSubmittedScopeFilter,
          createdAt: { $gte: thirtyDaysAgo }
        }),
        PrTracking.countDocuments({
          ...prSubmittedScopeFilter,
          createdAt: { $gte: sevenDaysAgo }
        })
      ]);

    // ==================== ML METRICS ====================
    const [issuesWithMlScore, issuesWithOverride, avgMlScore] = await Promise.all([
      Issue.countDocuments({ ...issueScopeFilter, mlScoring: { $ne: null } }),
      Issue.countDocuments({ ...issueScopeFilter, mlOverride: { $ne: null } }),
      Issue.aggregate([
        { $match: { ...issueScopeFilter, mlScoring: { $ne: null } } },
        { $group: { _id: null, avg: { $avg: "$mlScoring.beginnerScore" } } }
      ])
    ]);

    // ==================== RECOMMENDATION METRICS ====================
    const [totalRecommendationClicks, totalRecommendationClaims, totalRecommendationCompletions] =
      await Promise.all([
        Issue.aggregate([
          { $match: { ...issueScopeFilter } },
          { $group: { _id: null, total: { $sum: "$recommendationClicks" } } }
        ]),
        Issue.aggregate([
          { $match: { ...issueScopeFilter } },
          { $group: { _id: null, total: { $sum: "$recommendationClaims" } } }
        ]),
        Issue.aggregate([
          { $match: { ...issueScopeFilter } },
          { $group: { _id: null, total: { $sum: "$recommendationCompletions" } } }
        ])
      ]);

    const recommendationClicks = totalRecommendationClicks[0]?.total || 0;
    const recommendationClaims = totalRecommendationClaims[0]?.total || 0;
    const recommendationCompletions = totalRecommendationCompletions[0]?.total || 0;

    const recommendationSuccessRate =
      recommendationClicks > 0 ? recommendationClaims / recommendationClicks : 0;

    const completionRate =
      recommendationClaims > 0 ? recommendationCompletions / recommendationClaims : 0;

    // ==================== REPORT METRICS ====================
    const [totalReports, pendingReports, resolvedReports, reportsLast30Days] = scope.isAdmin
      ? await Promise.all([
          Report.countDocuments(),
          Report.countDocuments({ status: "pending" }),
          Report.countDocuments({ status: "resolved" }),
          Report.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
        ])
      : [0, 0, 0, 0];

    // ==================== REPOSITORY METRICS ====================
    let totalRepos = 0;
    let activeRepos = 0;

    if (scope.isAdmin) {
      [totalRepos, activeRepos] = await Promise.all([
        ApprovedRepo.countDocuments(),
        ApprovedRepo.countDocuments({ isActive: true })
      ]);
    } else {
      const fullNames = scope.allowedRepos.map((repo) => repo.fullName);
      totalRepos = fullNames.length;

      if (fullNames.length > 0) {
        activeRepos = await ApprovedRepo.countDocuments({
          isActive: true,
          fullName: { $in: fullNames }
        });
      }
    }

    // ==================== TIME SERIES DATA ====================
    const issuesTimeSeries = await Issue.aggregate([
      {
        $match: {
          ...issueScopeFilter,
          githubCreatedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$githubCreatedAt",
              timezone: "UTC"
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const claimsTimeSeries = await Issue.aggregate([
      {
        $match: {
          ...issueScopeFilter,
          claimedAt: { $gte: thirtyDaysAgo, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$claimedAt",
              timezone: "UTC"
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const mergedPrsTimeSeries = await PrTracking.aggregate([
      {
        $match: {
          ...prScopeFilter,
          status: "MERGED",
          updatedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$updatedAt",
              timezone: "UTC"
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // ==================== TOP CONTRIBUTORS ====================
    const topContributors = await PrTracking.aggregate([
      {
        $match: {
          ...prScopeFilter,
          status: "MERGED"
        }
      },
      {
        $group: {
          _id: "$userId",
          mergedPrCount: { $sum: 1 }
        }
      },
      { $sort: { mergedPrCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $project: {
          userId: "$_id",
          login: "$user.login",
          avatarUrl: "$user.avatarUrl",
          mergedPrCount: 1
        }
      }
    ]);

    // ==================== TOP REPOSITORIES ====================
    const topRepos = await Issue.aggregate([
      {
        $match: {
          ...issueScopeFilter
        }
      },
      {
        $group: {
          _id: { owner: "$repoOwner", name: "$repoName" },
          totalIssues: { $sum: 1 },
          claimedIssues: {
            $sum: { $cond: [{ $eq: ["$status", "claimed"] }, 1, 0] }
          }
        }
      },
      { $sort: { totalIssues: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          repoFullName: { $concat: ["$_id.owner", "/", "$_id.name"] },
          totalIssues: 1,
          claimedIssues: 1
        }
      }
    ]);

    return res.json({
      overview: {
        users: {
          total: totalUsers,
          newLast30Days: newUsersLast30Days,
          withActiveClaims: usersWithClaims,
          withPrs: usersWithPrs
        },
        issues: {
          total: totalIssues,
          open: openIssues,
          claimed: claimedIssues,
          closed: closedIssues,
          approved: approvedIssues,
          visible: visibleIssues,
          beginnerFriendly: beginnerFriendlyIssues,
          newLast30Days: issuesLast30Days
        },
        prs: {
          total: totalPrs,
          open: openPrs,
          merged: mergedPrs,
          closed: closedPrs,
          newLast30Days: prsLast30Days,
          newLast7Days: prsLast7Days
        },
        ml: {
          issuesScored: issuesWithMlScore,
          issuesWithOverride: issuesWithOverride,
          averageScore: avgMlScore[0]?.avg || 0,
          scoringCoverage: totalIssues > 0 ? issuesWithMlScore / totalIssues : 0
        },
        recommendations: {
          totalClicks: recommendationClicks,
          totalClaims: recommendationClaims,
          totalCompletions: recommendationCompletions,
          successRate: recommendationSuccessRate,
          completionRate: completionRate
        },
        reports: {
          total: totalReports,
          pending: pendingReports,
          resolved: resolvedReports,
          newLast30Days: reportsLast30Days
        },
        repositories: {
          total: totalRepos,
          active: activeRepos
        }
      },
      timeSeries: {
        issues: issuesTimeSeries,
        claims: claimsTimeSeries,
        mergedPrs: mergedPrsTimeSeries
      },
      topContributors,
      topRepositories: topRepos
    });
  } catch (err) {
    console.error("GET /api/admin/analytics error:", err);
    return res.status(500).json({ message: "Failed to load analytics" });
  }
});

// GET /api/admin/analytics/engagement - User engagement metrics
router.get("/analytics/engagement", async (req: AuthRequest, res: Response) => {
  try {
    const scope = await getModerationScope(req.userId!);
    if (!scope) {
      return res.status(403).json({ message: "Admin or moderator access required" });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentClaimFilter: Record<string, any> = {
      claimedAt: { $gte: thirtyDaysAgo, $ne: null }
    };
    applyIssueRepoScope(recentClaimFilter, scope);

    const recentPrFilter: Record<string, any> = {
      createdAt: { $gte: thirtyDaysAgo }
    };
    applyRepoFullNameScope(recentPrFilter, scope);

    const [claimers, prSubmitters] = await Promise.all([
      Issue.distinct("claimedByUserId", recentClaimFilter),
      PrTracking.distinct("userId", recentPrFilter)
    ]);

    const activeUserIds = new Set([
      ...claimers.filter((id) => id).map((id) => String(id)),
      ...prSubmitters.filter((id) => id).map((id) => String(id))
    ]);

    let totalUsers = 0;
    let roleDistribution: Array<{ _id: string | null; count: number }> = [];
    let experienceDistribution: Array<{ _id: string | null; count: number }> = [];

    if (scope.isAdmin) {
      totalUsers = await User.countDocuments();

      [roleDistribution, experienceDistribution] = await Promise.all([
        User.aggregate([
          {
            $group: {
              _id: "$role",
              count: { $sum: 1 }
            }
          }
        ]),
        User.aggregate([
          {
            $group: {
              _id: "$experienceLevel",
              count: { $sum: 1 }
            }
          }
        ])
      ]);
    } else {
      const allClaimedScopeFilter: Record<string, any> = {
        claimedByUserId: { $ne: null }
      };
      applyIssueRepoScope(allClaimedScopeFilter, scope);

      const allPrScopeFilter: Record<string, any> = {};
      applyRepoFullNameScope(allPrScopeFilter, scope);

      const [allClaimers, allPrUsers] = await Promise.all([
        Issue.distinct("claimedByUserId", allClaimedScopeFilter),
        PrTracking.distinct("userId", allPrScopeFilter)
      ]);

      const scopedUserIds = Array.from(
        new Set([
          ...allClaimers.filter((id) => id).map((id) => String(id)),
          ...allPrUsers.filter((id) => id).map((id) => String(id))
        ])
      );

      totalUsers = scopedUserIds.length;

      if (scopedUserIds.length > 0) {
        [roleDistribution, experienceDistribution] = await Promise.all([
          User.aggregate([
            { $match: { _id: { $in: scopedUserIds } } },
            {
              $group: {
                _id: "$role",
                count: { $sum: 1 }
              }
            }
          ]),
          User.aggregate([
            { $match: { _id: { $in: scopedUserIds } } },
            {
              $group: {
                _id: "$experienceLevel",
                count: { $sum: 1 }
              }
            }
          ])
        ]);
      }
    }

    return res.json({
      activeUsers: activeUserIds.size,
      totalUsers,
      activityRate: totalUsers > 0 ? activeUserIds.size / totalUsers : 0,
      roleDistribution: Object.fromEntries(
        roleDistribution.map((r) => [r._id || "unknown", r.count])
      ),
      experienceDistribution: Object.fromEntries(
        experienceDistribution.map((e) => [e._id || "unknown", e.count])
      )
    });
  } catch (err) {
    console.error("GET /api/admin/analytics/engagement error:", err);
    return res.status(500).json({ message: "Failed to load engagement metrics" });
  }
});

export default router;
