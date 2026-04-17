import {
  buildDetailPayload,
  buildSummary,
  splitRepo,
  toUiStatus
} from "../services/prTracking.service";

describe("prTracking.service helpers", () => {
  test("toUiStatus maps PR states to UI statuses", () => {
    expect(toUiStatus({ status: "MERGED" })).toBe("MERGED");
    expect(toUiStatus({ status: "PR_OPEN", reviewState: "CHANGES_REQUESTED" })).toBe(
      "CHANGES_REQUESTED"
    );
    expect(toUiStatus({ status: "PR_OPEN", requestedReviewersCount: 1 })).toBe("IN_REVIEW");
    expect(toUiStatus({ status: "ACCEPTED" })).toBe("OPEN");
  });

  test("buildSummary aggregates UI and backend status counts", () => {
    const summary = buildSummary([
      { status: "ACCEPTED" },
      { status: "PR_OPEN", requestedReviewersCount: 1 },
      { status: "PR_OPEN", reviewState: "CHANGES_REQUESTED" },
      { status: "MERGED" },
      { status: "CLOSED" }
    ]);

    expect(summary.total).toBe(5);
    expect(summary.open).toBe(2);
    expect(summary.inReview).toBe(1);
    expect(summary.changesRequested).toBe(1);
    expect(summary.merged).toBe(1);
    expect(summary.accepted).toBe(1);
    expect(summary.closed).toBe(1);
  });

  test("splitRepo returns owner/repo and fallback defaults", () => {
    expect(splitRepo("acme/platform")).toEqual({ owner: "acme", repo: "platform" });
    expect(splitRepo("bad-format")).toEqual({ owner: "bad-format", repo: "core-engine" });
    expect(splitRepo("")).toEqual({ owner: "opencollab", repo: "core-engine" });
  });

  test("buildDetailPayload prefers GitHub sidebar metadata and builds rich timeline", () => {
    const payload = buildDetailPayload(
      {
        _id: "tracking_1",
        repoFullName: "acme/platform",
        prNumber: 44,
        issueId: "issue_1",
        issueNumber: 202,
        issueTitle: "Fix CI regression",
        prTitle: "Stored title",
        prBody: "Stored body",
        prAuthor: "stored-author",
        status: "PR_OPEN",
        reviewState: "APPROVED",
        requestedReviewersCount: 1,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        additions: 10,
        deletions: 2,
        changedFiles: 1,
        primaryLanguage: "TypeScript"
      },
      {
        reviewers: [{ id: "reviewer", name: "reviewer", status: "approved" }],
        checks: [{ id: "1", name: "CI", status: "success", durationLabel: "2m", progress: 100 }],
        filesChangedTotal: 2,
        filesChanged: [{ path: "src/a.ts", additions: 8, deletions: 1 }],
        additions: 8,
        deletions: 1,
        timelineItems: [
          {
            type: "commit",
            sha: "abcdef123456",
            message: "fix: ci",
            author: "dev",
            committedAt: "2026-01-02T09:00:00Z"
          },
          {
            type: "review",
            id: "rev1",
            login: "maintainer",
            state: "APPROVED",
            body: "Looks good",
            submittedAt: "2026-01-02T10:00:00Z"
          },
          {
            type: "comment",
            id: "com1",
            login: "maintainer",
            body: "Please add tests",
            createdAt: "2026-01-02T11:00:00Z",
            isReview: false
          }
        ],
        prHeadRef: "feature/ci",
        prBaseRef: "main",
        prLabels: ["ci", "bug"],
        prTitle: "Live title",
        prBody: "Live body",
        prAuthor: "live-author",
        prState: "open",
        prMergedAt: null,
        prClosedAt: null,
        prCreatedAt: "2026-01-02T08:00:00Z",
        prUpdatedAt: "2026-01-02T12:00:00Z",
        commentsCount: 3,
        reviewCommentsCount: 1
      },
      {
        _id: "issue_1",
        githubNumber: 202,
        title: "Fix CI regression",
        status: "claimed",
        prStatus: "PR_OPEN",
        repoOwner: "acme",
        repoName: "platform",
        repoLanguage: "TypeScript",
        beginnerFriendly: true,
        labels: ["good first issue"],
        githubUrl: "https://github.com/acme/platform/issues/202",
        requiredSkills: ["typescript"],
        expectedOutcome: ["tests"],
        suggestedResources: [{ title: "Guide", url: "https://example.com", type: "docs" }]
      }
    );

    expect(payload.title).toBe("Live title");
    expect(payload.status).toBe("IN_REVIEW");
    expect(payload.sourceBranch).toBe("feature/ci");
    expect(payload.targetBranch).toBe("main");
    expect(payload.tags).toEqual(["ci", "bug"]);
    expect(payload.overview.author).toBe("live-author");
    expect(payload.sidebar.filesChangedTotal).toBe(2);
    expect(payload.sidebar.systemStatusLabel).toBe("Open");
    expect(payload.overview.linkedIssue).not.toBeNull();
    expect(payload.overview.linkedIssue?.id).toBe("issue_1");
    expect(payload.timeline.length).toBeGreaterThanOrEqual(3);
  });

  test("buildDetailPayload falls back to stored values and marks merged system status", () => {
    const payload = buildDetailPayload({
      _id: "tracking_2",
      repoFullName: "acme/core",
      prNumber: 55,
      issueNumber: 808,
      issueTitle: "Legacy issue",
      prTitle: "Stored merged title",
      prBody: "Stored merged body",
      prAuthor: "stored-author",
      status: "MERGED",
      mergedAt: new Date("2026-02-01T00:00:00Z"),
      requestedReviewersCount: 0,
      reviewState: null,
      primaryLanguage: "Go",
      prParticipants: ["stored-reviewer"],
      additions: 4,
      deletions: 1,
      changedFiles: 1,
      createdAt: new Date("2026-01-01T00:00:00Z")
    });

    expect(payload.title).toBe("Stored merged title");
    expect(payload.status).toBe("MERGED");
    expect(payload.sidebar.systemStatusLabel).toBe("Merged");
    expect(payload.overview.linkedIssue).not.toBeNull();
    expect(payload.overview.linkedIssue?.number).toBe(808);
    expect(payload.timeline.some((item: any) => item.id === "merged")).toBe(true);
  });
});
