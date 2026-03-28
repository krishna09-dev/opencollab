import { PrTracking } from "../models/PrTracking";
import { Issue } from "../models/Issue";
import { User } from "../models/User";
import { fetchPRsForIssue, fetchPrByNumber, parsePrUrl, computeStatusFromPR } from "./githubPr.service";
import { getGithubTokenForUser } from "./userToken.service";

// ========== TYPES ==========

type UiPrStatus = "OPEN" | "IN_REVIEW" | "CHANGES_REQUESTED" | "MERGED";

// ========== HELPER FUNCTIONS ==========

export function toUiStatus(item: any): UiPrStatus {
  if (item?.status === "MERGED") return "MERGED";
  if (item?.status === "PR_OPEN") {
    if (item?.reviewState === "CHANGES_REQUESTED") return "CHANGES_REQUESTED";
    if ((item?.requestedReviewersCount ?? 0) > 0 || item?.reviewState === "APPROVED" || item?.reviewState === "COMMENTED") {
      return "IN_REVIEW";
    }
  }
  return "OPEN";
}

export function buildSummary(items: any[]) {
  const uiCounts = { open: 0, inReview: 0, changesRequested: 0, merged: 0 };
  for (const item of items) {
    const ui = toUiStatus(item);
    if (ui === "OPEN") uiCounts.open++;
    if (ui === "IN_REVIEW") uiCounts.inReview++;
    if (ui === "CHANGES_REQUESTED") uiCounts.changesRequested++;
    if (ui === "MERGED") uiCounts.merged++;
  }

  return {
    total: items.length,
    open: uiCounts.open,
    inReview: uiCounts.inReview,
    changesRequested: uiCounts.changesRequested,
    merged: uiCounts.merged,
    accepted: items.filter((x) => x.status === "ACCEPTED").length,
    closed: items.filter((x) => x.status === "CLOSED").length
  };
}

export function splitRepo(fullName: string) {
  const [owner, repo] = String(fullName || "").split("/");
  return {
    owner: owner || "opencollab",
    repo: repo || "core-engine"
  };
}

export function buildDetailPayload(item: any) {
  const { owner, repo } = splitRepo(item.repoFullName);
  const prNumber = item.prNumber ?? 42;
  const displayStatus = toUiStatus(item);
  const statusText = displayStatus === "CHANGES_REQUESTED" ? "OPEN" : displayStatus;

  return {
    id: String(item._id),
    title: item.prTitle || item.issueTitle || `Pull Request #${prNumber}`,
    number: prNumber,
    owner,
    repo,
    status: statusText,
    sourceBranch: "auth-refactor",
    targetBranch: "main",
    tags: ["Enhancement", "Auth"],
    overview: {
      author: "alex_dev",
      commentedAtLabel: "3 hours ago",
      intro:
        item.prBody ||
        "This PR replaces the legacy session-based authentication with a more robust JWT-based flow.",
      changes: [
        "Implemented AuthService using jsonwebtoken.",
        "Added middleware for token verification on protected routes.",
        "Updated client-side state management to handle token persistence.",
        "Refactored /login and /register endpoints."
      ],
      note:
        "This requires a new environment variable JWT_SECRET to be set in production.",
      linkedIssue: {
        number: item.issueNumber,
        title: item.issueTitle || "Implement Secure Auth Flow",
        openedBy: "systems_lead"
      }
    },
    timeline: [
      {
        id: "opened",
        type: "opened",
        actor: "alex_dev",
        text: "opened this pull request",
        atLabel: "3 hours ago"
      },
      {
        id: "commits",
        type: "commits",
        commits: [
          { sha: "a7b2c4e", message: "feat: implement jwt generation logic", atLabel: "2 hours ago" },
          { sha: "8d9f1e2", message: "fix: middleware error handling", atLabel: "1 hour ago" }
        ]
      },
      {
        id: "review-requested",
        type: "reviewRequested",
        actor: "alex_dev",
        reviewers: ["mike_ux", "sarah_tech"]
      },
      {
        id: "changes-requested",
        type: "changesRequested",
        actor: "mike_ux",
        atLabel: "45 mins ago",
        summary:
          "The token expiration is currently set to 30 days. We should reduce this to 1 hour and implement refresh tokens for better security.",
        diffOld: "expiresIn: '30d'",
        diffNew: "expiresIn: '1h'"
      },
      {
        id: "maintainer-feedback",
        type: "maintainerFeedback",
        title: "Maintainer Feedback",
        body:
          "Great overall implementation. Please address Mike's concern regarding the expiration time. Once that's done and CI checks pass, I'm ready to merge."
      },
      {
        id: "conversation-restricted",
        type: "restriction",
        body: "Conversation is restricted to maintainers or authorized reviewers"
      }
    ],
    sidebar: {
      reviewers: [
        { id: "sarah_tech", name: "sarah_tech", status: "approved" },
        { id: "mike_ux", name: "mike_ux", status: "changes_requested" },
        { id: "john_dev", name: "john_dev", status: "pending" }
      ],
      checks: [
        { id: "vercel", name: "Vercel Deployment", status: "success", durationLabel: "2m", progress: 100 },
        { id: "unit-tests", name: "Unit Tests (154/154)", status: "success", durationLabel: "4m", progress: 100 },
        { id: "e2e", name: "E2E Tests", status: "running", durationLabel: "Running...", progress: 65 }
      ],
      filesChangedTotal: 4,
      filesChanged: [
        { path: "src/services/auth.ts", additions: 124, deletions: 12 },
        { path: "src/middleware/auth.ts", additions: 45, deletions: 0 },
        { path: "src/routes/login.ts", additions: 12, deletions: 30 }
      ],
      linkedIssue: {
        number: item.issueNumber,
        title: item.issueTitle || "Implement Secure Auth Flow",
        openedBy: "systems_lead"
      },
      systemStatusLabel: "All systems operational"
    }
  };
}

// ========== SERVICE CLASS ==========

export class PrTrackingService {
  /**
   * List all PRs that the user can see:
   * - PRs they created (userId matches)
   * - PRs where they are in allowedUserIds
   */
  async listTrackedPRs(userId: string): Promise<{ summary: object; items: any[] }> {
    const items = await PrTracking.find({
      $or: [
        { userId },
        { allowedUserIds: userId }
      ]
    })
      .sort({ updatedAt: -1 })
      .lean();

    const mapped = items.map((item) => ({
      ...item,
      displayStatus: toUiStatus(item)
    }));

    return { summary: buildSummary(mapped), items: mapped };
  }

  async getTrackedPR(id: string, userId: string): Promise<any | null> {
    const item = await PrTracking.findOne({
      _id: id,
      $or: [{ userId }, { allowedUserIds: userId }]
    }).lean();
    return item;
  }

  async getTrackedPRDetail(id: string, userId: string): Promise<object | null> {
    const item = await PrTracking.findOne({
      _id: id,
      $or: [{ userId }, { allowedUserIds: userId }]
    }).lean();
    if (!item) return null;
    return buildDetailPayload(item);
  }

  /**
   * Add a PR directly by URL (e.g., https://github.com/owner/repo/pull/123)
   * This fetches the PR data from GitHub and stores it in the database.
   * Only users involved in the PR (author, reviewers, commenters) can see it.
   */
  async addPrByUrl(userId: string, prUrlInput: string): Promise<{ item: any; created: boolean }> {
    const parsed = parsePrUrl(prUrlInput);
    if (!parsed) {
      throw new Error("Invalid PR URL format. Expected: https://github.com/owner/repo/pull/123");
    }

    const { owner, repo, prNumber } = parsed;
    const repoFullName = `${owner}/${repo}`;

    // Check if PR already exists
    const existing = await PrTracking.findOne({
      repoFullName,
      prNumber
    }).lean();

    if (existing) {
      // Add user to allowedUserIds if not already there
      await PrTracking.updateOne(
        { _id: existing._id },
        { $addToSet: { allowedUserIds: userId } }
      );
      const updated = await PrTracking.findById(existing._id).lean();
      return { item: updated, created: false };
    }

    // Fetch PR data from GitHub using user's token
    const githubToken = await getGithubTokenForUser(userId);
    if (!githubToken) {
      throw new Error("Missing GitHub token. Please re-authenticate with GitHub.");
    }

    const prData = await fetchPrByNumber({ githubToken, owner, repo, prNumber });
    if (!prData) {
      throw new Error(`PR not found: ${prUrlInput}`);
    }

    const status = computeStatusFromPR({
      state: prData.state,
      merged_at: prData.merged_at,
      closed_at: prData.closed_at
    });

    // Find user IDs for participants (if they exist in our system)
    const participantLogins = [prData.author, ...prData.participants].filter(Boolean) as string[];
    const participantUsers = await User.find({ login: { $in: participantLogins } }).select("_id").lean();
    const allowedUserIds = [userId, ...participantUsers.map((u) => String(u._id))];

    const doc = await PrTracking.create({
      userId,
      allowedUserIds,
      prUrlInput,
      repoFullName,
      prNumber,
      prTitle: prData.title,
      prBody: prData.body,
      prUrl: prData.html_url,
      prState: prData.state,
      mergedAt: prData.merged_at ? new Date(prData.merged_at) : null,
      closedAt: prData.closed_at ? new Date(prData.closed_at) : null,
      prUpdatedAt: prData.updated_at ? new Date(prData.updated_at) : null,
      additions: prData.additions,
      deletions: prData.deletions,
      changedFiles: prData.changed_files,
      createdAtGithub: prData.created_at ? new Date(prData.created_at) : null,
      updatedAtGithub: prData.updated_at ? new Date(prData.updated_at) : null,
      mergedAtGithub: prData.merged_at ? new Date(prData.merged_at) : null,
      primaryLanguage: prData.language,
      requestedReviewersCount: prData.requested_reviewers_count,
      reviewState: prData.review_state,
      commentsCount: prData.comments,
      reviewCommentsCount: prData.review_comments,
      prAuthor: prData.author,
      prParticipants: prData.participants,
      status,
      lastSyncAt: new Date(),
      syncSource: "manual"
    });

    return { item: doc.toObject(), created: true };
  }

  /**
   * Refresh a single PR using user's token (manual refresh)
   */
  async refreshSinglePr(userId: string, id: string): Promise<{ updated: boolean }> {
    const item = await PrTracking.findOne({
      _id: id,
      $or: [{ userId }, { allowedUserIds: userId }]
    }).lean();

    if (!item) {
      throw new Error("PR not found or access denied");
    }

    const githubToken = await getGithubTokenForUser(userId);
    if (!githubToken) {
      throw new Error("Missing GitHub token. Please re-authenticate with GitHub.");
    }

    // If it's a direct PR (has prNumber but no issueNumber), fetch by PR number
    if (item.prNumber && !item.issueNumber) {
      const [owner, repo] = item.repoFullName.split("/");
      const prData = await fetchPrByNumber({ githubToken, owner, repo, prNumber: item.prNumber });

      if (!prData) {
        return { updated: false };
      }

      const status = computeStatusFromPR({
        state: prData.state,
        merged_at: prData.merged_at,
        closed_at: prData.closed_at
      });

      // Update participant list
      const participantLogins = [prData.author, ...prData.participants].filter(Boolean) as string[];
      const participantUsers = await User.find({ login: { $in: participantLogins } }).select("_id").lean();
      const newAllowedUserIds = [...new Set([userId, ...participantUsers.map((u) => String(u._id))])];

      await PrTracking.updateOne(
        { _id: item._id },
        {
          $set: {
            prTitle: prData.title,
            prBody: prData.body,
            prUrl: prData.html_url,
            prState: prData.state,
            mergedAt: prData.merged_at ? new Date(prData.merged_at) : null,
            closedAt: prData.closed_at ? new Date(prData.closed_at) : null,
            prUpdatedAt: prData.updated_at ? new Date(prData.updated_at) : null,
            additions: prData.additions,
            deletions: prData.deletions,
            changedFiles: prData.changed_files,
            createdAtGithub: prData.created_at ? new Date(prData.created_at) : null,
            updatedAtGithub: prData.updated_at ? new Date(prData.updated_at) : null,
            mergedAtGithub: prData.merged_at ? new Date(prData.merged_at) : null,
            primaryLanguage: prData.language,
            requestedReviewersCount: prData.requested_reviewers_count,
            reviewState: prData.review_state,
            commentsCount: prData.comments,
            reviewCommentsCount: prData.review_comments,
            prAuthor: prData.author,
            prParticipants: prData.participants,
            status,
            lastSyncAt: new Date(),
            syncSource: "manual"
          },
          $addToSet: { allowedUserIds: { $each: newAllowedUserIds } }
        }
      );

      return { updated: true };
    }

    // Otherwise, use the existing issue-based refresh logic
    if (!item.issueNumber) {
      return { updated: false };
    }

    const pulls = await fetchPRsForIssue({
      githubToken,
      repoFullName: item.repoFullName,
      issueNumber: item.issueNumber
    });

    const best =
      pulls.find((p) => p.merged_at) ||
      pulls.find((p) => p.state === "open") ||
      pulls[0] ||
      null;

    const status = computeStatusFromPR(
      best
        ? { state: best.state, merged_at: best.merged_at, closed_at: best.closed_at }
        : null
    );

    await PrTracking.updateOne(
      { _id: item._id },
      {
        $set: {
          prNumber: best ? best.number : null,
          prTitle: best ? best.title : null,
          prBody: best ? best.body : null,
          prUrl: best ? best.html_url : null,
          prState: best ? best.state : null,
          mergedAt: best?.merged_at ? new Date(best.merged_at) : null,
          closedAt: best?.closed_at ? new Date(best.closed_at) : null,
          prUpdatedAt: best?.updated_at ? new Date(best.updated_at) : null,
          primaryLanguage: best?.language ?? null,
          requestedReviewersCount: best?.requested_reviewers_count ?? 0,
          reviewState: best?.review_state ?? null,
          commentsCount: best?.comments ?? 0,
          reviewCommentsCount: best?.review_comments ?? 0,
          prAuthor: best?.author ?? null,
          prParticipants: best?.participants ?? [],
          status,
          lastSyncAt: new Date(),
          syncSource: "manual"
        }
      }
    );

    return { updated: true };
  }

  /**
   * System sync - refresh all PRs using system token
   * Called by scheduled worker every 15 minutes
   */
  async systemSyncAll(systemToken: string): Promise<{ synced: number; errors: number }> {
    // Get PRs that haven't been synced in the last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const items = await PrTracking.find({
      status: { $in: ["PR_OPEN", "ACCEPTED"] }, // Only sync open PRs
      $or: [
        { lastSystemSyncAt: null },
        { lastSystemSyncAt: { $lt: fifteenMinutesAgo } }
      ]
    }).lean();

    let synced = 0;
    let errors = 0;

    for (const item of items) {
      try {
        // Direct PR (has prNumber but no issueNumber)
        if (item.prNumber && !item.issueNumber) {
          const [owner, repo] = item.repoFullName.split("/");
          const prData = await fetchPrByNumber({
            githubToken: systemToken,
            owner,
            repo,
            prNumber: item.prNumber
          });

          if (prData) {
            const status = computeStatusFromPR({
              state: prData.state,
              merged_at: prData.merged_at,
              closed_at: prData.closed_at
            });

            await PrTracking.updateOne(
              { _id: item._id },
              {
                $set: {
                  prTitle: prData.title,
                  prBody: prData.body,
                  prUrl: prData.html_url,
                  prState: prData.state,
                  mergedAt: prData.merged_at ? new Date(prData.merged_at) : null,
                  closedAt: prData.closed_at ? new Date(prData.closed_at) : null,
                  prUpdatedAt: prData.updated_at ? new Date(prData.updated_at) : null,
                  primaryLanguage: prData.language,
                  requestedReviewersCount: prData.requested_reviewers_count,
                  reviewState: prData.review_state,
                  commentsCount: prData.comments,
                  reviewCommentsCount: prData.review_comments,
                  prAuthor: prData.author,
                  prParticipants: prData.participants,
                  status,
                  lastSystemSyncAt: new Date(),
                  syncSource: "worker"
                }
              }
            );
            synced++;
          }
        } else if (item.issueNumber) {
          // Issue-based PR
          const pulls = await fetchPRsForIssue({
            githubToken: systemToken,
            repoFullName: item.repoFullName,
            issueNumber: item.issueNumber
          });

          const best =
            pulls.find((p) => p.merged_at) ||
            pulls.find((p) => p.state === "open") ||
            pulls[0] ||
            null;

          const status = computeStatusFromPR(
            best
              ? { state: best.state, merged_at: best.merged_at, closed_at: best.closed_at }
              : null
          );

          await PrTracking.updateOne(
            { _id: item._id },
            {
              $set: {
                prNumber: best ? best.number : null,
                prTitle: best ? best.title : null,
                prBody: best ? best.body : null,
                prUrl: best ? best.html_url : null,
                prState: best ? best.state : null,
                mergedAt: best?.merged_at ? new Date(best.merged_at) : null,
                closedAt: best?.closed_at ? new Date(best.closed_at) : null,
                prUpdatedAt: best?.updated_at ? new Date(best.updated_at) : null,
                primaryLanguage: best?.language ?? null,
                requestedReviewersCount: best?.requested_reviewers_count ?? 0,
                reviewState: best?.review_state ?? null,
                commentsCount: best?.comments ?? 0,
                reviewCommentsCount: best?.review_comments ?? 0,
                prAuthor: best?.author ?? null,
                prParticipants: best?.participants ?? [],
                status,
                lastSystemSyncAt: new Date(),
                syncSource: "worker"
              }
            }
          );
          synced++;
        }
      } catch (err) {
        console.error(`Failed to sync PR ${item._id}:`, err);
        errors++;
      }
    }

    return { synced, errors };
  }

  /**
   * Submit a PR for an issue: validate URL, check issue exists, fetch from GitHub,
   * verify PR author matches current user, save/update PrTracking, update Issue.prStatus.
   */
  async submitPr(userId: string, issueId: string, prUrl: string) {
    const PR_URL_REGEX = /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/;
    const match = prUrl.match(PR_URL_REGEX);
    if (!match) {
      throw Object.assign(new Error("Invalid PR URL format. Expected: https://github.com/owner/repo/pull/123"), { statusCode: 400 });
    }

    const [, repoOwner, repoName, prNumberStr] = match;
    const githubPrNumber = parseInt(prNumberStr, 10);

    const issue = await Issue.findById(issueId);
    if (!issue) {
      throw Object.assign(new Error("Issue not found"), { statusCode: 404 });
    }

    const user = await User.findById(userId).select("login githubAccessToken githubToken").lean();
    if (!user) {
      throw Object.assign(new Error("Unauthorized"), { statusCode: 403 });
    }

    const githubToken = (user as any)?.githubAccessToken || (user as any)?.githubToken;
    if (!githubToken) {
      throw Object.assign(new Error("Missing GitHub token. Please re-authenticate with GitHub."), { statusCode: 401 });
    }

    const prData = await fetchPrByNumber({ githubToken, owner: repoOwner, repo: repoName, prNumber: githubPrNumber });
    if (!prData) {
      throw Object.assign(new Error("PR not found on GitHub"), { statusCode: 404 });
    }

    if (prData.author !== (user as any).login) {
      throw Object.assign(new Error("You can only submit PRs that you authored on GitHub"), { statusCode: 403 });
    }

    const status = this.mapPrStatus(prData.merged_at, prData.state);

    const doc = await PrTracking.findOneAndUpdate(
      { issueId, userId, repoFullName: `${repoOwner}/${repoName}`, prNumber: githubPrNumber },
      {
        $set: {
          userId,
          issueId,
          prUrlInput: prUrl,
          repoFullName: `${repoOwner}/${repoName}`,
          issueNumber: issue.githubNumber,
          issueTitle: issue.title,
          prNumber: githubPrNumber,
          prTitle: prData.title,
          prBody: prData.body,
          prUrl: prData.html_url,
          prState: prData.state,
          mergedAt: prData.merged_at ? new Date(prData.merged_at) : null,
          closedAt: prData.closed_at ? new Date(prData.closed_at) : null,
          prUpdatedAt: prData.updated_at ? new Date(prData.updated_at) : null,
          additions: prData.additions,
          deletions: prData.deletions,
          changedFiles: prData.changed_files,
          createdAtGithub: prData.created_at ? new Date(prData.created_at) : null,
          updatedAtGithub: prData.updated_at ? new Date(prData.updated_at) : null,
          mergedAtGithub: prData.merged_at ? new Date(prData.merged_at) : null,
          primaryLanguage: prData.language,
          requestedReviewersCount: prData.requested_reviewers_count,
          reviewState: prData.review_state,
          commentsCount: prData.comments,
          reviewCommentsCount: prData.review_comments,
          prAuthor: prData.author,
          prParticipants: prData.participants,
          status,
          lastSyncAt: new Date(),
          syncSource: "manual"
        },
        $addToSet: { allowedUserIds: userId }
      },
      { upsert: true, new: true }
    ).lean();

    // Update Issue.prStatus
    const issuePrStatus = status === "PR_OPEN" ? "PR_OPEN" : status === "MERGED" ? "MERGED" : status === "CLOSED" ? "CLOSED" : "NONE";
    await Issue.updateOne({ _id: issueId }, { $set: { prStatus: issuePrStatus } });

    return doc;
  }

  /**
   * Re-fetch a single PR from GitHub by tracking record ID and update DB.
   */
  async refreshById(userId: string, trackingId: string) {
    const item = await PrTracking.findOne({
      _id: trackingId,
      $or: [{ userId }, { allowedUserIds: userId }]
    }).lean();

    if (!item) {
      throw Object.assign(new Error("PR tracking record not found"), { statusCode: 404 });
    }

    if (!item.prNumber) {
      throw Object.assign(new Error("No PR number associated with this record"), { statusCode: 400 });
    }

    const githubToken = await getGithubTokenForUser(userId);
    if (!githubToken) {
      throw Object.assign(new Error("Missing GitHub token. Please re-authenticate with GitHub."), { statusCode: 401 });
    }

    const [owner, repo] = item.repoFullName.split("/");
    const prData = await fetchPrByNumber({ githubToken, owner, repo, prNumber: item.prNumber });
    if (!prData) {
      throw Object.assign(new Error("PR not found on GitHub"), { statusCode: 404 });
    }

    const status = this.mapPrStatus(prData.merged_at, prData.state);

    await PrTracking.updateOne(
      { _id: item._id },
      {
        $set: {
          prTitle: prData.title,
          prBody: prData.body,
          prUrl: prData.html_url,
          prState: prData.state,
          mergedAt: prData.merged_at ? new Date(prData.merged_at) : null,
          closedAt: prData.closed_at ? new Date(prData.closed_at) : null,
          prUpdatedAt: prData.updated_at ? new Date(prData.updated_at) : null,
          additions: prData.additions,
          deletions: prData.deletions,
          changedFiles: prData.changed_files,
          createdAtGithub: prData.created_at ? new Date(prData.created_at) : null,
          updatedAtGithub: prData.updated_at ? new Date(prData.updated_at) : null,
          mergedAtGithub: prData.merged_at ? new Date(prData.merged_at) : null,
          primaryLanguage: prData.language,
          requestedReviewersCount: prData.requested_reviewers_count,
          reviewState: prData.review_state,
          commentsCount: prData.comments,
          reviewCommentsCount: prData.review_comments,
          prAuthor: prData.author,
          prParticipants: prData.participants,
          status,
          lastSyncAt: new Date(),
          syncSource: "manual"
        }
      }
    );

    // Update Issue.prStatus if linked
    if (item.issueId) {
      const issuePrStatus = status === "PR_OPEN" ? "PR_OPEN" : status === "MERGED" ? "MERGED" : status === "CLOSED" ? "CLOSED" : "NONE";
      await Issue.updateOne({ _id: item.issueId }, { $set: { prStatus: issuePrStatus } });
    }

    const updated = await PrTracking.findById(item._id).lean();
    return updated;
  }

  /**
   * Get PR tracking details by issue ID.
   */
  async getByIssueId(issueId: string, userId: string) {
    const item = await PrTracking.findOne({
      issueId,
      $or: [{ userId }, { allowedUserIds: userId }]
    }).lean();
    return item;
  }

  /**
   * Map GitHub PR state to our status enum.
   * merged === true → MERGED, state === "open" → PR_OPEN (displayed as OPEN), else → CLOSED.
   */
  private mapPrStatus(mergedAt: string | null, state: string | null | undefined): "PR_OPEN" | "MERGED" | "CLOSED" {
    if (mergedAt) return "MERGED";
    if (state === "open") return "PR_OPEN";
    return "CLOSED";
  }

  async seedDemo(userId: string): Promise<{ inserted: number; ids: string[] }> {
    const demos = [
      {
        repoFullName: "opencollab/core-engine",
        issueNumber: 123,
        issueTitle: "Implement Secure Auth Flow",
        prNumber: 42,
        prTitle: "Refactor Authentication Flow",
        prBody:
          "This PR replaces the legacy session-based authentication with a more robust JWT-based flow and improves security boundaries.",
        prUrl: "https://github.com/opencollab/core-engine/pull/42",
        prState: "open",
        status: "PR_OPEN",
        primaryLanguage: "TypeScript",
        requestedReviewersCount: 2,
        reviewState: "CHANGES_REQUESTED",
        commentsCount: 9,
        reviewCommentsCount: 14
      },
      {
        repoFullName: "opencollab/web",
        issueNumber: 77,
        issueTitle: "Improve PR filtering UX",
        prNumber: 128,
        prTitle: "feat: Improve PR tracking filter chips",
        prBody:
          "Introduces clearer status chips and improves accessibility semantics for filter controls.",
        prUrl: "https://github.com/opencollab/web/pull/128",
        prState: "open",
        status: "PR_OPEN",
        primaryLanguage: "TypeScript",
        requestedReviewersCount: 1,
        reviewState: "COMMENTED",
        commentsCount: 3,
        reviewCommentsCount: 5
      }
    ];

    const createdIds: string[] = [];

    for (const demo of demos) {
      const record = await PrTracking.findOneAndUpdate(
        {
          userId,
          repoFullName: demo.repoFullName,
          issueNumber: demo.issueNumber
        },
        {
          $set: {
            userId,
            ...demo,
            syncSource: "manual",
            lastSyncAt: new Date()
          }
        },
        { upsert: true, new: true }
      ).lean();

      createdIds.push(String(record._id));
    }

    return { inserted: createdIds.length, ids: createdIds };
  }

  async ensureTracking(
    userId: string,
    data: { repoFullName: string; issueNumber: number; issueTitle?: string }
  ): Promise<any> {
    const doc = await PrTracking.findOneAndUpdate(
      {
        userId,
        repoFullName: String(data.repoFullName).trim(),
        issueNumber: Number(data.issueNumber)
      },
      {
        $setOnInsert: {
          userId,
          repoFullName: String(data.repoFullName).trim(),
          issueNumber: Number(data.issueNumber),
          issueTitle: String(data.issueTitle ?? ""),
          status: "ACCEPTED",
          syncSource: "manual"
        }
      },
      { upsert: true, new: true }
    ).lean();

    return doc;
  }

  async refreshTracking(userId: string, id?: string): Promise<{ updated: number }> {
    const githubToken = await getGithubTokenForUser(userId);
    if (!githubToken) {
      throw new Error("Missing GitHub token for user. Ensure OAuth stores it in User model.");
    }

    const list = id
      ? await PrTracking.find({ _id: id, userId }).lean()
      : await PrTracking.find({ userId }).lean();

    if (!list.length) {
      return { updated: 0 };
    }

    let updated = 0;

    for (const item of list) {
      if (!item.issueNumber) continue;
      const pulls = await fetchPRsForIssue({
        githubToken,
        repoFullName: item.repoFullName,
        issueNumber: item.issueNumber
      });

      const best =
        pulls.find((p) => p.merged_at) ||
        pulls.find((p) => p.state === "open") ||
        pulls[0] ||
        null;

      const status = computeStatusFromPR(
        best
          ? { state: best.state, merged_at: best.merged_at, closed_at: best.closed_at }
          : null
      );

      await PrTracking.updateOne(
        { _id: item._id },
        {
          $set: {
            prNumber: best ? best.number : null,
            prTitle: best ? best.title : null,
            prBody: best ? best.body : null,
            prUrl: best ? best.html_url : null,
            prState: best ? best.state : null,
            mergedAt: best?.merged_at ? new Date(best.merged_at) : null,
            closedAt: best?.closed_at ? new Date(best.closed_at) : null,
            prUpdatedAt: best?.updated_at ? new Date(best.updated_at) : null,
            primaryLanguage: best?.language ?? null,
            requestedReviewersCount: best?.requested_reviewers_count ?? 0,
            reviewState: best?.review_state ?? null,
            commentsCount: best?.comments ?? 0,
            reviewCommentsCount: best?.review_comments ?? 0,
            status,
            lastSyncAt: new Date(),
            syncSource: "manual"
          }
        }
      );

      updated++;
    }

    return { updated };
  }
}

export const prTrackingService = new PrTrackingService();
