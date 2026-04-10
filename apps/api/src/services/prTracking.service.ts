import { PrTracking } from "../models/PrTracking";
import { Issue, type IssueUpdateItem } from "../models/Issue";
import { User } from "../models/User";
import { ApprovedRepo } from "../models/ApprovedRepo";
import {
  fetchPRsForIssue,
  fetchPrByNumber,
  parsePrUrl,
  computeStatusFromPR,
  fetchPrSidebarData,
  type GitHubPrSidebarData
} from "./githubPr.service";
import { getGithubTokenForUser } from "./userToken.service";

// ========== TYPES ==========

type UiPrStatus = "OPEN" | "IN_REVIEW" | "CHANGES_REQUESTED" | "MERGED";
type PrStatus = "ACCEPTED" | "PR_OPEN" | "MERGED" | "CLOSED";
type IssuePrStatus = "NONE" | "PR_OPEN" | "MERGED" | "CLOSED";

// ========== HELPER FUNCTIONS ==========

function shortId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

/**
 * Add a PR-related update to an issue's updates array.
 * This creates entries like "PR #123 opened" or "PR #123 was merged".
 */
async function addPrUpdateToIssue(
  issueId: string | undefined | null,
  prNumber: number | null | undefined,
  prAuthor: string | null | undefined,
  newStatus: PrStatus,
  oldStatus?: PrStatus | null
): Promise<void> {
  if (!issueId || !prNumber) return;

  // Determine what event to record based on status transition
  let updateBody: string | null = null;
  let updateId: string | null = null;

  if (newStatus === "PR_OPEN" && (!oldStatus || oldStatus === "ACCEPTED")) {
    // PR was just opened/linked
    updateBody = `Pull request #${prNumber} was opened`;
    updateId = shortId(`pr_opened_${prNumber}`);
  } else if (newStatus === "MERGED" && oldStatus !== "MERGED") {
    // PR was merged
    updateBody = `Pull request #${prNumber} was merged`;
    updateId = shortId(`pr_merged_${prNumber}`);
  } else if (newStatus === "CLOSED" && oldStatus !== "CLOSED" && oldStatus !== "MERGED") {
    // PR was closed without merging
    updateBody = `Pull request #${prNumber} was closed`;
    updateId = shortId(`pr_closed_${prNumber}`);
  }

  if (!updateBody || !updateId) return;

  const update: IssueUpdateItem = {
    id: updateId,
    actorLogin: prAuthor || "unknown",
    actorRole: "GITHUB_PR",
    body: updateBody,
    createdAt: new Date()
  };

  await Issue.updateOne(
    { _id: issueId },
    { $push: { updates: update } }
  );
}

function mapIssuePrStatus(status: PrStatus): IssuePrStatus {
  if (status === "PR_OPEN") return "PR_OPEN";
  if (status === "MERGED") return "MERGED";
  if (status === "CLOSED") return "CLOSED";
  return "NONE";
}

async function syncLinkedIssueFromPrStatus(
  issueId: string | undefined | null,
  status: PrStatus
): Promise<void> {
  if (!issueId) return;

  const issuePrStatus = mapIssuePrStatus(status);
  const setPayload: Record<string, unknown> = { prStatus: issuePrStatus };

  // Business rule: once the linked PR is merged, mark the issue as closed in OpenCollab.
  if (status === "MERGED") {
    setPayload.status = "closed";
  }

  await Issue.updateOne({ _id: issueId }, { $set: setPayload });
}

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

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toExactCaseInsensitiveRegex(value: string) {
  return new RegExp(`^${escapeRegex(value)}$`, "i");
}

function hasSubmittedPrMetadata(item: any): boolean {
  if (!item) return false;
  const hasPrNumber = typeof item.prNumber === "number" && Number.isFinite(item.prNumber) && item.prNumber > 0;
  return hasPrNumber || Boolean(item.prUrl) || Boolean(item.prTitle);
}

function timeAgo(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return "";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

function mapReviewerStatus(reviewState: string | null | undefined): "approved" | "changes_requested" | "pending" {
  if (reviewState === "APPROVED") return "approved";
  if (reviewState === "CHANGES_REQUESTED") return "changes_requested";
  return "pending";
}

export function buildDetailPayload(item: any, githubSidebar?: GitHubPrSidebarData | null) {
  const { owner, repo } = splitRepo(item.repoFullName);
  const prNumber = item.prNumber ?? null;

  // Prefer fresh GitHub values over stored DB values — this is what keeps the
  // detail page from showing stale title/body/author/state between manual syncs.
  const liveAuthor = githubSidebar?.prAuthor ?? item.prAuthor ?? null;
  const liveTitle = githubSidebar?.prTitle ?? item.prTitle ?? null;
  const liveBody = githubSidebar?.prBody ?? item.prBody ?? null;
  const liveMergedAt = githubSidebar?.prMergedAt ?? (item.mergedAt ? new Date(item.mergedAt).toISOString() : null);
  const liveClosedAt = githubSidebar?.prClosedAt ?? (item.closedAt ? new Date(item.closedAt).toISOString() : null);
  const liveCreatedAt = githubSidebar?.prCreatedAt ?? item.createdAtGithub ?? item.createdAt ?? null;

  // Derive the display status from live data when available so the chip
  // reflects reality even before the next refresh tick writes to Mongo.
  const syntheticItem = githubSidebar
    ? {
        ...item,
        status: computeStatusFromPR({
          state: githubSidebar.prState,
          merged_at: githubSidebar.prMergedAt,
          closed_at: githubSidebar.prClosedAt
        }),
        reviewState: (() => {
          const reviews = (githubSidebar.timelineItems || []).filter((t: any) => t.type === "review") as Array<{ state: string }>;
          if (!reviews.length) return item.reviewState ?? null;
          const last = reviews[reviews.length - 1];
          return last.state || item.reviewState || null;
        })(),
        requestedReviewersCount: (githubSidebar.reviewers || []).filter((r) => r.status === "pending").length
      }
    : item;

  const displayStatus = toUiStatus(syntheticItem);
  const statusText = displayStatus === "CHANGES_REQUESTED" ? "OPEN" : displayStatus;

  // Build timeline dynamically from stored data + GitHub live data
  const timeline: any[] = [];

  // Always add "opened" event
  timeline.push({
    id: "opened",
    type: "opened",
    actor: liveAuthor || "unknown",
    text: "opened this pull request",
    atLabel: timeAgo(liveCreatedAt)
  });

  if (githubSidebar?.timelineItems && githubSidebar.timelineItems.length > 0) {
    // Build timeline from real GitHub data

    const commits = githubSidebar.timelineItems.filter((t) => t.type === "commit") as any[];
    const reviewsAndComments = githubSidebar.timelineItems.filter((t) => t.type === "review" || t.type === "comment") as any[];

    // Group commits as a single "commits" block
    if (commits.length > 0) {
      timeline.push({
        id: "commits",
        type: "commits",
        commits: commits.map((c: any) => ({
          sha: c.sha.slice(0, 7),
          message: c.message.split("\n")[0].slice(0, 100),
          atLabel: timeAgo(c.committedAt)
        }))
      });
    }

    // Sort reviews and comments chronologically
    reviewsAndComments.sort((a: any, b: any) => {
      const aTime = new Date(a.submittedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.submittedAt || b.createdAt || 0).getTime();
      return aTime - bTime;
    });

    for (const entry of reviewsAndComments) {
      if (entry.type === "review") {
        if (entry.state === "CHANGES_REQUESTED") {
          timeline.push({
            id: `review-${entry.id}`,
            type: "changesRequested",
            actor: entry.login,
            atLabel: timeAgo(entry.submittedAt),
            summary: entry.body || "Changes were requested on this pull request.",
            diffOld: "",
            diffNew: ""
          });
        } else if (entry.state === "APPROVED") {
          timeline.push({
            id: `review-${entry.id}`,
            type: "maintainerFeedback",
            title: "Approved",
            body: entry.body ? `${entry.login}: ${entry.body}` : `${entry.login} approved this pull request.`
          });
        }
      } else if (entry.type === "comment" && entry.body) {
        timeline.push({
          id: `comment-${entry.id}`,
          type: "comment",
          actor: entry.login,
          body: entry.body,
          atLabel: timeAgo(entry.createdAt),
          isReview: entry.isReview
        });
      }
    }
  } else {
    // Fallback: use stored DB data
    if (item.reviewState === "CHANGES_REQUESTED") {
      timeline.push({
        id: "changes-requested",
        type: "changesRequested",
        actor: item.prParticipants?.[0] || "reviewer",
        atLabel: timeAgo(item.prUpdatedAt || item.updatedAt),
        summary: "Changes were requested on this pull request.",
        diffOld: "",
        diffNew: ""
      });
    } else if (item.reviewState === "APPROVED") {
      timeline.push({
        id: "approved",
        type: "maintainerFeedback",
        title: "Approved",
        body: "This pull request has been approved."
      });
    }
  }

  // Add merged event if merged
  if (liveMergedAt) {
    timeline.push({
      id: "merged",
      type: "maintainerFeedback",
      title: "Merged",
      body: `This pull request was merged ${timeAgo(liveMergedAt)}.`
    });
  }

  // Add closed event if closed without merge
  if (liveClosedAt && !liveMergedAt) {
    timeline.push({
      id: "closed",
      type: "maintainerFeedback",
      title: "Closed",
      body: `This pull request was closed ${timeAgo(liveClosedAt)}.`
    });
  }

  // Build reviewers list from participants (fallback)
  const reviewers = (item.prParticipants || [])
    .filter((p: string) => p && p !== item.prAuthor)
    .slice(0, 5)
    .map((login: string, idx: number) => ({
      id: login,
      name: login,
      status: idx === 0 ? mapReviewerStatus(item.reviewState) : "pending" as const
    }));

  const fallbackFiles = [] as Array<{ path: string; additions: number; deletions: number }>;
  const sidebarReviewers = githubSidebar?.reviewers && githubSidebar.reviewers.length > 0
    ? githubSidebar.reviewers
    : reviewers;
  const sidebarChecks = githubSidebar?.checks ?? [];
  const sidebarFiles = githubSidebar?.filesChanged ?? fallbackFiles;
  const sidebarFilesTotal = githubSidebar?.filesChangedTotal ?? item.changedFiles ?? sidebarFiles.length;
  const sidebarAdditions = githubSidebar?.additions ?? item.additions ?? 0;
  const sidebarDeletions = githubSidebar?.deletions ?? item.deletions ?? 0;

  // Derive branches and labels from GitHub if available, fall back to DB
  const sourceBranch = githubSidebar?.prHeadRef || item.prHeadRef || "feature-branch";
  const targetBranch = githubSidebar?.prBaseRef || item.prBaseRef || "main";
  const tags = githubSidebar?.prLabels && githubSidebar.prLabels.length > 0
    ? githubSidebar.prLabels
    : (item.primaryLanguage ? [item.primaryLanguage] : []);

  const liveSystemStatus = liveMergedAt
    ? "Merged"
    : liveClosedAt
      ? "Closed"
      : item.status === "MERGED"
        ? "Merged"
        : item.status === "CLOSED"
          ? "Closed"
          : "Open";

  return {
    id: String(item._id),
    title: liveTitle || item.issueTitle || (prNumber ? `Pull Request #${prNumber}` : "Pull Request"),
    number: prNumber,
    owner,
    repo,
    status: statusText,
    sourceBranch,
    targetBranch,
    tags,
    overview: {
      author: liveAuthor || "unknown",
      commentedAtLabel: timeAgo(liveCreatedAt),
      intro: liveBody || item.issueTitle || "No description provided.",
      changes: [],
      note: null,
      linkedIssue: item.issueNumber ? {
        number: item.issueNumber,
        title: item.issueTitle || `Issue #${item.issueNumber}`,
        openedBy: liveAuthor || "unknown"
      } : null
    },
    timeline,
    sidebar: {
      reviewers: sidebarReviewers.length > 0 ? sidebarReviewers : [],
      checks: sidebarChecks,
      filesChangedTotal: sidebarFilesTotal,
      filesChanged: sidebarFiles,
      linkedIssue: item.issueNumber ? {
        number: item.issueNumber,
        title: item.issueTitle || `Issue #${item.issueNumber}`,
        openedBy: liveAuthor || "unknown"
      } : null,
      systemStatusLabel: liveSystemStatus,
      additions: sidebarAdditions,
      deletions: sidebarDeletions
    }
  };
}

// ========== SERVICE CLASS ==========

export class PrTrackingService {
  private buildVisibilityFilter(userId: string) {
    return {
      $or: [
        { userId },
        { allowedUserIds: userId },
        { isVerified: true, isValid: true, prUrl: { $ne: null } }
      ]
    };
  }

  private normalizeRepoFullName(repoFullNameInput: string): string {
    const [ownerRaw = "", repoRaw = ""] = String(repoFullNameInput || "").trim().split("/");
    const owner = ownerRaw.trim().toLowerCase();
    const repo = repoRaw.trim().toLowerCase();

    if (!owner || !repo) {
      throw Object.assign(new Error("Invalid repository format. Expected owner/repo."), { statusCode: 400 });
    }

    return `${owner}/${repo}`;
  }

  private async assertRepoIsApproved(repoFullNameInput: string): Promise<string> {
    const repoFullName = this.normalizeRepoFullName(repoFullNameInput);
    const approved = await ApprovedRepo.exists({
      fullName: { $regex: toExactCaseInsensitiveRegex(repoFullName) },
      isActive: true
    });

    if (!approved) {
      throw Object.assign(
        new Error(`Repository ${repoFullName} is not approved for PR tracking in OpenCollab.`),
        { statusCode: 403 }
      );
    }

    return repoFullName;
  }

  /**
   * List all PRs that the user can see:
   * - PRs they created (userId matches)
   * - PRs where they are in allowedUserIds
   * - PRs approved by admins (verified + valid)
   */
  async listTrackedPRs(userId: string): Promise<{ summary: object; items: any[] }> {
    const items = await PrTracking.find(this.buildVisibilityFilter(userId))
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
      ...this.buildVisibilityFilter(userId)
    }).lean();
    return item;
  }

  async getTrackedPRDetail(id: string, userId: string): Promise<object | null> {
    const item = await PrTracking.findOne({
      _id: id,
      ...this.buildVisibilityFilter(userId)
    }).lean();
    if (!item) return null;

    let githubSidebar: GitHubPrSidebarData | null = null;

    if (item.prNumber) {
      const githubToken = (await getGithubTokenForUser(userId)) || process.env.GITHUB_SYSTEM_TOKEN || null;
      if (githubToken) {
        const [owner, repo] = String(item.repoFullName || "").split("/");
        if (owner && repo) {
          try {
            githubSidebar = await fetchPrSidebarData({
              githubToken,
              owner,
              repo,
              prNumber: item.prNumber
            });
          } catch (err) {
            // Keep detail page available even if GitHub enrichment fails.
            console.warn(`Failed to enrich PR detail sidebar for ${item.repoFullName}#${item.prNumber}:`, err);
          }
        }
      }
    }

    return buildDetailPayload(item, githubSidebar);
  }

  /**
   * Add a PR directly by URL (e.g., https://github.com/owner/repo/pull/123)
   * This fetches the PR data from GitHub and stores it in the database.
   * Only users involved in the PR (author, reviewers, commenters) can see it.
   */
  async addPrByUrl(userId: string, prUrlInput: string): Promise<{ item: any; created: boolean }> {
    const parsed = parsePrUrl(prUrlInput);
    if (!parsed) {
      throw Object.assign(new Error("Invalid PR URL format. Expected: https://github.com/owner/repo/pull/123"), { statusCode: 400 });
    }

    const { owner, repo, prNumber } = parsed;
    const repoFullName = await this.assertRepoIsApproved(`${owner}/${repo}`);
    const [normalizedOwner, normalizedRepo] = repoFullName.split("/");

    // Check if PR already exists
    const existing = await PrTracking.findOne({
      repoFullName: { $regex: toExactCaseInsensitiveRegex(repoFullName) },
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
      throw Object.assign(new Error("Missing GitHub token. Please re-authenticate with GitHub."), { statusCode: 401 });
    }

    const prData = await fetchPrByNumber({
      githubToken,
      owner: normalizedOwner,
      repo: normalizedRepo,
      prNumber
    });
    if (!prData) {
      throw Object.assign(new Error(`PR not found: ${prUrlInput}`), { statusCode: 404 });
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

    // Prefer direct PR-number refresh whenever we have a PR number.
    // This avoids losing linkage details when issue mention search is incomplete.
    if (item.prNumber) {
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

      if (item.issueId) {
        await syncLinkedIssueFromPrStatus(String(item.issueId), status);

        if (item.status !== status) {
          await addPrUpdateToIssue(
            String(item.issueId),
            item.prNumber,
            prData.author,
            status,
            item.status as PrStatus
          );
        }
      }

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

    if (item.issueId) {
      await syncLinkedIssueFromPrStatus(String(item.issueId), status);

      if (item.status !== status) {
        await addPrUpdateToIssue(
          String(item.issueId),
          best?.number || item.prNumber,
          best?.author || item.prAuthor,
          status,
          item.status as PrStatus
        );
      }
    }

    return { updated: true };
  }

  /**
   * System sync - refresh all PRs using system token
   * Called by scheduled worker every 15 minutes
   */
  async systemSyncAll(systemToken: string): Promise<{ synced: number; errors: number }> {
    // Get PRs that haven't been synced in the last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Sync all PRs that haven't been synced recently, including those that may have been closed/merged
    // We still sync CLOSED/MERGED to catch any updates (comments, etc.) and to handle edge cases
    const items = await PrTracking.find({
      $or: [
        { lastSystemSyncAt: null },
        { lastSystemSyncAt: { $lt: fifteenMinutesAgo } }
      ]
    }).lean();

    let synced = 0;
    let errors = 0;

    for (const item of items) {
      try {
        // Prefer direct PR-number refresh whenever PR number exists.
        if (item.prNumber) {
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

            if (item.issueId) {
              await syncLinkedIssueFromPrStatus(String(item.issueId), status);

              if (item.status !== status) {
                await addPrUpdateToIssue(
                  String(item.issueId),
                  item.prNumber,
                  prData.author,
                  status,
                  item.status as PrStatus
                );
              }
            }

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

          // Keep linked issue status in sync for all transitions.
          if (item.issueId) {
            await syncLinkedIssueFromPrStatus(String(item.issueId), status);

            if (item.status !== status) {
              await addPrUpdateToIssue(
                String(item.issueId),
                best?.number || item.prNumber,
                best?.author || item.prAuthor,
                status,
                item.status as PrStatus
              );
            }
          }

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
    const parsed = parsePrUrl(prUrl);
    if (!parsed) {
      throw Object.assign(new Error("Invalid PR URL format. Expected: https://github.com/owner/repo/pull/123"), { statusCode: 400 });
    }

    const { owner: repoOwner, repo: repoName, prNumber: githubPrNumber } = parsed;

    const issue = await Issue.findById(issueId);
    if (!issue) {
      throw Object.assign(new Error("Issue not found"), { statusCode: 404 });
    }

    const claimedByUserId = issue.claimedByUserId ? String(issue.claimedByUserId) : null;
    if (!claimedByUserId || claimedByUserId !== userId || (issue.status !== "claimed" && issue.status !== "closed")) {
      throw Object.assign(
        new Error("You can only submit a PR for an issue currently claimed by you."),
        { statusCode: 403 }
      );
    }

    const issueRepoFullName = await this.assertRepoIsApproved(`${issue.repoOwner}/${issue.repoName}`);
    const submittedRepoFullName = await this.assertRepoIsApproved(`${repoOwner}/${repoName}`);
    if (submittedRepoFullName !== issueRepoFullName) {
      throw Object.assign(
        new Error(`PR repository must match the issue repository (${issueRepoFullName}).`),
        { statusCode: 400 }
      );
    }

    const user = await User.findById(userId).select("login githubAccessToken githubToken").lean();
    if (!user) {
      throw Object.assign(new Error("Unauthorized"), { statusCode: 403 });
    }

    const githubToken = (user as any)?.githubAccessToken || (user as any)?.githubToken;
    if (!githubToken) {
      throw Object.assign(new Error("Missing GitHub token. Please re-authenticate with GitHub."), { statusCode: 401 });
    }

    const [normalizedOwner, normalizedRepo] = submittedRepoFullName.split("/");
    const prData = await fetchPrByNumber({
      githubToken,
      owner: normalizedOwner,
      repo: normalizedRepo,
      prNumber: githubPrNumber
    });
    if (!prData) {
      throw Object.assign(new Error("PR not found on GitHub"), { statusCode: 404 });
    }

    const submittedAuthor = String(prData.author || "").trim().toLowerCase();
    const currentUserLogin = String((user as any).login || "").trim().toLowerCase();
    if (!submittedAuthor || !currentUserLogin || submittedAuthor !== currentUserLogin) {
      throw Object.assign(new Error("You can only submit PRs that you authored on GitHub"), { statusCode: 403 });
    }

    const status = this.mapPrStatus(prData.merged_at, prData.state);

    // Reuse existing records so the same PR can be linked to an issue without duplicate-key conflicts.
    const existingByPr = await PrTracking.findOne({
      userId,
      repoFullName: { $regex: toExactCaseInsensitiveRegex(submittedRepoFullName) },
      prNumber: githubPrNumber
    }).lean();

    const existingByIssue = await PrTracking.findOne({
      userId,
      repoFullName: { $regex: toExactCaseInsensitiveRegex(submittedRepoFullName) },
      issueNumber: issue.githubNumber
    }).lean();

    if (existingByPr?.issueId && String(existingByPr.issueId) !== issueId) {
      throw Object.assign(new Error("This PR is already linked to another issue."), { statusCode: 409 });
    }

    if (
      existingByPr &&
      existingByIssue &&
      String(existingByPr._id) !== String(existingByIssue._id)
    ) {
      await PrTracking.deleteOne({ _id: existingByIssue._id });
    }

    const targetId = existingByPr?._id || existingByIssue?._id;

    const doc = await PrTracking.findOneAndUpdate(
      targetId
        ? { _id: targetId }
        : { userId, repoFullName: submittedRepoFullName, issueNumber: issue.githubNumber },
      {
        $set: {
          userId,
          issueId,
          prUrlInput: prUrl,
          repoFullName: submittedRepoFullName,
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
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    // Sync linked issue status from the submitted PR status.
    await syncLinkedIssueFromPrStatus(issueId, status);

    // Add PR opened event to issue updates
    await addPrUpdateToIssue(issueId, githubPrNumber, prData.author, status, null);

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

    const githubToken = await getGithubTokenForUser(userId);
    if (!githubToken) {
      throw Object.assign(new Error("Missing GitHub token. Please re-authenticate with GitHub."), { statusCode: 401 });
    }

    let resolvedPrNumber = item.prNumber ?? null;

    if (!resolvedPrNumber) {
      const parsedFromUrl = parsePrUrl(String(item.prUrlInput || item.prUrl || ""));
      if (parsedFromUrl?.prNumber) {
        resolvedPrNumber = parsedFromUrl.prNumber;
      }
    }

    if (!resolvedPrNumber && item.issueNumber) {
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

      if (best?.number) {
        resolvedPrNumber = best.number;
      }
    }

    if (!resolvedPrNumber) {
      throw Object.assign(new Error("No PR number associated with this record"), { statusCode: 400 });
    }

    if (item.prNumber !== resolvedPrNumber) {
      await PrTracking.updateOne(
        { _id: item._id },
        { $set: { prNumber: resolvedPrNumber } }
      );
    }

    const [owner, repo] = item.repoFullName.split("/");
    const prData = await fetchPrByNumber({ githubToken, owner, repo, prNumber: resolvedPrNumber });
    if (!prData) {
      throw Object.assign(new Error("PR not found on GitHub"), { statusCode: 404 });
    }

    const status = this.mapPrStatus(prData.merged_at, prData.state);

    await PrTracking.updateOne(
      { _id: item._id },
      {
        $set: {
          prNumber: resolvedPrNumber,
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

    // Sync linked issue status and add PR update to issue
    if (item.issueId) {
      const oldStatus = item.status as PrStatus;
      await syncLinkedIssueFromPrStatus(String(item.issueId), status);
      
      // Add PR event to issue updates if status changed
      if (oldStatus !== status) {
        await addPrUpdateToIssue(
          String(item.issueId),
          resolvedPrNumber,
          prData.author,
          status,
          oldStatus
        );
      }
    }

    const updated = await PrTracking.findById(item._id).lean();
    return updated;
  }

  /**
   * Get PR tracking details by issue ID.
   */
  async getByIssueId(issueId: string, userId: string) {
    const issueLinked = await PrTracking.find({
      issueId,
      ...this.buildVisibilityFilter(userId)
    })
      .sort({ updatedAt: -1 })
      .lean();

    const issueLinkedWithPr = issueLinked.find((row) => hasSubmittedPrMetadata(row));
    if (issueLinkedWithPr) {
      return issueLinkedWithPr;
    }

    const issue = await Issue.findById(issueId).select("repoOwner repoName githubNumber").lean();
    if (!issue) return null;

    const fallbackRepoFullName = this.normalizeRepoFullName(`${issue.repoOwner}/${issue.repoName}`);
    const fallbackCandidates = await PrTracking.find({
      repoFullName: { $regex: toExactCaseInsensitiveRegex(fallbackRepoFullName) },
      issueNumber: issue.githubNumber,
      ...this.buildVisibilityFilter(userId)
    })
      .sort({ updatedAt: -1 })
      .lean();

    const fallbackWithPr = fallbackCandidates.find((row) => hasSubmittedPrMetadata(row));

    if (fallbackWithPr && !fallbackWithPr.issueId) {
      await PrTracking.updateOne({ _id: fallbackWithPr._id }, { $set: { issueId } });
      return { ...fallbackWithPr, issueId };
    }

    if (fallbackWithPr) return fallbackWithPr;

    // Legacy placeholders (rows without PR metadata) should be treated as no PR submitted.
    const fallbackPlaceholder = fallbackCandidates[0] ?? issueLinked[0] ?? null;
    if (fallbackPlaceholder && !fallbackPlaceholder.issueId) {
      await PrTracking.updateOne({ _id: fallbackPlaceholder._id }, { $set: { issueId } });
    }

    return null;
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
    const repoFullName = await this.assertRepoIsApproved(data.repoFullName);

    const doc = await PrTracking.findOneAndUpdate(
      {
        userId,
        repoFullName,
        issueNumber: Number(data.issueNumber)
      },
      {
        $setOnInsert: {
          userId,
          repoFullName,
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
      if (item.prNumber) {
        const [owner, repo] = item.repoFullName.split("/");
        const prData = await fetchPrByNumber({ githubToken, owner, repo, prNumber: item.prNumber });

        if (!prData) continue;

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

        if (item.issueId) {
          await syncLinkedIssueFromPrStatus(String(item.issueId), status);

          if (item.status !== status) {
            await addPrUpdateToIssue(
              String(item.issueId),
              item.prNumber,
              prData.author,
              status,
              item.status as PrStatus
            );
          }
        }

        updated++;
        continue;
      }

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

      if (item.issueId) {
        await syncLinkedIssueFromPrStatus(String(item.issueId), status);

        if (item.status !== status) {
          await addPrUpdateToIssue(
            String(item.issueId),
            best?.number || item.prNumber,
            best?.author || item.prAuthor,
            status,
            item.status as PrStatus
          );
        }
      }

      updated++;
    }

    return { updated };
  }
}

export const prTrackingService = new PrTrackingService();
