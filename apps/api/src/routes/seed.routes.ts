import { Router, Response } from "express";
import { AuthRequest, authRequired } from "../middleware/auth";
import { Resource } from "../models/Resource";
import { PrTracking } from "../models/PrTracking";
import { Issue } from "../models/Issue";

const router = Router();

const SEED_RESOURCES = [
  {
    title: "GitHub Pull Requests Documentation",
    url: "https://docs.github.com/en/pull-requests",
    description: "Official GitHub guide to creating and reviewing pull requests.",
    type: "docs",
    difficulty: "beginner",
    tags: ["github", "pull-request", "git"],
    topics: ["pr", "workflow"],
    language: null,
    isFeatured: true,
    qualityScore: 95
  },
  {
    title: "How to Write a Good Commit Message",
    url: "https://cbea.ms/git-commit/",
    description: "Practical guide to writing clear, useful commit messages.",
    type: "article",
    difficulty: "beginner",
    tags: ["git", "commit"],
    topics: ["workflow"],
    language: null,
    isFeatured: true,
    qualityScore: 90
  },
  {
    title: "Git Branching - Atlassian Tutorial",
    url: "https://www.atlassian.com/git/tutorials/using-branches",
    description: "Learn branching strategies and how to manage branches effectively.",
    type: "article",
    difficulty: "beginner",
    tags: ["git", "branch"],
    topics: ["workflow"],
    language: null,
    isFeatured: false,
    qualityScore: 86
  },
  {
    title: "Testing JavaScript (Jest) Getting Started",
    url: "https://jestjs.io/docs/getting-started",
    description: "Official Jest docs to start writing tests in JavaScript/TypeScript.",
    type: "docs",
    difficulty: "intermediate",
    tags: ["testing", "jest", "javascript", "typescript"],
    topics: ["testing"],
    language: "TypeScript",
    isFeatured: true,
    qualityScore: 88
  },
  {
    title: "How to Contribute to Open Source (GitHub Guide)",
    url: "https://opensource.guide/how-to-contribute/",
    description: "A beginner-friendly guide on contributing to open-source.",
    type: "article",
    difficulty: "beginner",
    tags: ["open-source", "github", "community"],
    topics: ["issues", "pr"],
    language: null,
    isFeatured: true,
    qualityScore: 92
  }
];

const SEED_PRS = [
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
  },
  {
    repoFullName: "facebook/react",
    issueNumber: 402,
    issueTitle: "Optimize Reconciliation for Concurrent Mode",
    prNumber: 28491,
    prTitle: "refactor: Optimize Reconciliation algorithm for concurrent mode",
    prBody:
      "This PR introduces a more efficient way to track pending fiber updates by utilizing bitmasks instead of array iterations in the main render loop.",
    prUrl: "https://github.com/facebook/react/pull/28491",
    prState: "open",
    status: "PR_OPEN",
    primaryLanguage: "TypeScript",
    requestedReviewersCount: 2,
    reviewState: "COMMENTED",
    commentsCount: 2,
    reviewCommentsCount: 8
  },
  {
    repoFullName: "vercel/next.js",
    issueNumber: 1203,
    issueTitle: "Edge Runtime Auth Compatibility",
    prNumber: 54122,
    prTitle: "fix: Edge Runtime compatibility for middleware auth",
    prBody:
      "Addressing compatibility issues when using the native crypto API in Vercel Edge functions within the middleware layer.",
    prUrl: "https://github.com/vercel/next.js/pull/54122",
    prState: "open",
    status: "PR_OPEN",
    primaryLanguage: "JavaScript",
    requestedReviewersCount: 1,
    reviewState: "CHANGES_REQUESTED",
    commentsCount: 1,
    reviewCommentsCount: 15
  }
];

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

const SEED_ISSUES = [
  {
    githubNumber: 28491,
    repoOwner: "facebook",
    repoName: "react",
    title: "Fix hydration mismatch error when using Suspense boundaries in SSR",
    body: "I've noticed that when using lazy loading components inside a suspense boundary during server-side rendering, the hydration process throws a warning about mismatched HTML content. This seems to happen specifically when using React.lazy() with Suspense in a streaming SSR context.",
    summary: "Hydration mismatch in lazy-loaded components within Suspense boundaries during SSR streaming.",
    labels: ["TypeScript", "Bug", "High Priority"],
    status: "open" as const,
    githubUrl: "https://github.com/facebook/react/issues/28491",
    githubCreatedAt: daysAgo(0),
    githubUpdatedAt: daysAgo(0),
    openedAt: daysAgo(0),
    requiredSkills: ["React", "TypeScript", "SSR", "Debugging"],
    expectedOutcome: ["Fix the hydration mismatch so SSR streaming works correctly with Suspense."],
    beginnerFriendly: false,
    activeMaintainer: true,
    recentlyUpdated: true,
    repoHealth: { healthScore: 95, activityScore: 98, openIssues: 1200, recentCommits: 85 },
    prStatus: "NONE" as const,
    updates: [],
    contributionTimeline: [],
    notifyWatchers: [],
    autoSetupCommands: [],
    projectSetupCommands: [],
    suggestedResources: []
  },
  {
    githubNumber: 54102,
    repoOwner: "vercel",
    repoName: "next.js",
    title: "Update documentation for Image component optimization props",
    body: "The current docs for next/image are missing examples for the new loaderFile prop introduced in v14. We need to add a section explaining how to use it with custom CDNs and show before/after examples.",
    summary: "Missing documentation for loaderFile prop in next/image component.",
    labels: ["JavaScript", "Documentation", "Good First Issue"],
    status: "open" as const,
    githubUrl: "https://github.com/vercel/next.js/issues/54102",
    githubCreatedAt: daysAgo(1),
    githubUpdatedAt: daysAgo(0),
    openedAt: daysAgo(1),
    requiredSkills: ["Next.js", "JavaScript", "Technical Writing"],
    expectedOutcome: ["Update docs with loaderFile examples and CDN integration guide."],
    beginnerFriendly: true,
    activeMaintainer: true,
    recentlyUpdated: true,
    repoHealth: { healthScore: 92, activityScore: 95, openIssues: 2100, recentCommits: 120 },
    prStatus: "NONE" as const,
    updates: [],
    contributionTimeline: [],
    notifyWatchers: [],
    autoSetupCommands: [],
    projectSetupCommands: [],
    suggestedResources: []
  },
  {
    githubNumber: 1294,
    repoOwner: "tailwindlabs",
    repoName: "tailwindcss",
    title: "Add support for container queries in arbitrary values",
    body: "Currently, arbitrary values work great for most utilities, but container queries seem to ignore custom breakpoints defined inline. Would be great to have @container-[500px]:bg-red-500 working out of the box.",
    summary: "Container queries don't work with arbitrary breakpoint values in Tailwind utilities.",
    labels: ["CSS", "Feature Request", "Enhancement"],
    status: "open" as const,
    githubUrl: "https://github.com/tailwindlabs/tailwindcss/issues/1294",
    githubCreatedAt: daysAgo(2),
    githubUpdatedAt: daysAgo(1),
    openedAt: daysAgo(2),
    requiredSkills: ["CSS", "PostCSS", "Tailwind CSS"],
    expectedOutcome: ["Implement container query support for arbitrary values."],
    beginnerFriendly: false,
    activeMaintainer: true,
    recentlyUpdated: true,
    repoHealth: { healthScore: 90, activityScore: 88, openIssues: 340, recentCommits: 40 },
    prStatus: "NONE" as const,
    updates: [],
    contributionTimeline: [],
    notifyWatchers: [],
    autoSetupCommands: [],
    projectSetupCommands: [],
    suggestedResources: []
  },
  {
    githubNumber: 98321,
    repoOwner: "rust-lang",
    repoName: "rust",
    title: "Optimization pass for borrow checker diagnostics",
    body: "Some error messages regarding lifetimes are still a bit cryptic for newcomers. We have a proposal to simplify the output for common distinct lifetime mismatch errors and suggest fixes inline.",
    summary: "Improve borrow checker error messages to be more beginner-friendly.",
    labels: ["Rust", "Compiler", "Diagnostics"],
    status: "open" as const,
    githubUrl: "https://github.com/rust-lang/rust/issues/98321",
    githubCreatedAt: daysAgo(3),
    githubUpdatedAt: daysAgo(2),
    openedAt: daysAgo(3),
    requiredSkills: ["Rust", "Compilers", "Diagnostics"],
    expectedOutcome: ["Simplify lifetime error messages and add inline suggestions."],
    beginnerFriendly: false,
    activeMaintainer: true,
    recentlyUpdated: true,
    repoHealth: { healthScore: 96, activityScore: 99, openIssues: 8900, recentCommits: 200 },
    prStatus: "NONE" as const,
    updates: [],
    contributionTimeline: [],
    notifyWatchers: [],
    autoSetupCommands: [],
    projectSetupCommands: [],
    suggestedResources: []
  },
  {
    githubNumber: 42156,
    repoOwner: "microsoft",
    repoName: "TypeScript",
    title: "Improve type inference for nested generic functions",
    body: "When passing a generic function as an argument to another generic function, TypeScript sometimes fails to infer types correctly and falls back to `unknown`. This is particularly noticeable with higher-order utility types like Partial<ReturnType<T>>.",
    summary: "TypeScript fails to infer types for nested generic function arguments.",
    labels: ["TypeScript", "Bug", "Type Inference"],
    status: "open" as const,
    githubUrl: "https://github.com/microsoft/TypeScript/issues/42156",
    githubCreatedAt: daysAgo(1),
    githubUpdatedAt: daysAgo(0),
    openedAt: daysAgo(1),
    requiredSkills: ["TypeScript", "Type Systems", "Compiler Design"],
    expectedOutcome: ["Fix type inference for nested generics without breaking existing behavior."],
    beginnerFriendly: false,
    activeMaintainer: true,
    recentlyUpdated: true,
    repoHealth: { healthScore: 94, activityScore: 96, openIssues: 5200, recentCommits: 90 },
    prStatus: "NONE" as const,
    updates: [],
    contributionTimeline: [],
    notifyWatchers: [],
    autoSetupCommands: [],
    projectSetupCommands: [],
    suggestedResources: []
  },
  {
    githubNumber: 31045,
    repoOwner: "sveltejs",
    repoName: "svelte",
    title: "Add TypeScript support for $derived rune type narrowing",
    body: "When using the $derived rune with conditional logic, TypeScript doesn't narrow the type correctly. For example, `$derived(value ? value.name : 'default')` doesn't infer the return type as `string`.",
    summary: "$derived rune doesn't narrow types in conditional expressions.",
    labels: ["TypeScript", "Svelte 5", "Runes"],
    status: "open" as const,
    githubUrl: "https://github.com/sveltejs/svelte/issues/31045",
    githubCreatedAt: daysAgo(4),
    githubUpdatedAt: daysAgo(1),
    openedAt: daysAgo(4),
    requiredSkills: ["Svelte", "TypeScript", "Compilers"],
    expectedOutcome: ["Ensure $derived rune correctly narrows TypeScript types."],
    beginnerFriendly: false,
    activeMaintainer: true,
    recentlyUpdated: true,
    repoHealth: { healthScore: 88, activityScore: 90, openIssues: 450, recentCommits: 55 },
    prStatus: "NONE" as const,
    updates: [],
    contributionTimeline: [],
    notifyWatchers: [],
    autoSetupCommands: [],
    projectSetupCommands: [],
    suggestedResources: []
  },
  {
    githubNumber: 8834,
    repoOwner: "expressjs",
    repoName: "express",
    title: "Add native async error handling middleware",
    body: "Express currently doesn't catch rejected promises in async route handlers, requiring developers to wrap every handler in try/catch. Proposing a built-in wrapper that auto-catches async errors and forwards them to the error handler.",
    summary: "Async route handlers don't forward rejected promises to error middleware.",
    labels: ["JavaScript", "Enhancement", "Good First Issue"],
    status: "open" as const,
    githubUrl: "https://github.com/expressjs/express/issues/8834",
    githubCreatedAt: daysAgo(5),
    githubUpdatedAt: daysAgo(3),
    openedAt: daysAgo(5),
    requiredSkills: ["Node.js", "Express", "JavaScript"],
    expectedOutcome: ["Add async error catching middleware to Express core."],
    beginnerFriendly: true,
    activeMaintainer: true,
    recentlyUpdated: true,
    repoHealth: { healthScore: 82, activityScore: 70, openIssues: 180, recentCommits: 10 },
    prStatus: "NONE" as const,
    updates: [],
    contributionTimeline: [],
    notifyWatchers: [],
    autoSetupCommands: [],
    projectSetupCommands: [],
    suggestedResources: []
  },
  {
    githubNumber: 19244,
    repoOwner: "django",
    repoName: "django",
    title: "Add async support to custom model managers",
    body: "Django's ORM now supports async views and queries, but custom model managers still require sync code. We need async variants of get_queryset() and other manager methods to fully support async workflows.",
    summary: "Custom model managers lack async support in Django's async ORM.",
    labels: ["Python", "ORM", "Async"],
    status: "open" as const,
    githubUrl: "https://github.com/django/django/issues/19244",
    githubCreatedAt: daysAgo(6),
    githubUpdatedAt: daysAgo(2),
    openedAt: daysAgo(6),
    requiredSkills: ["Python", "Django", "Async Programming"],
    expectedOutcome: ["Implement async variants for custom manager methods."],
    beginnerFriendly: false,
    activeMaintainer: true,
    recentlyUpdated: true,
    repoHealth: { healthScore: 93, activityScore: 88, openIssues: 1500, recentCommits: 60 },
    prStatus: "NONE" as const,
    updates: [],
    contributionTimeline: [],
    notifyWatchers: [],
    autoSetupCommands: [],
    projectSetupCommands: [],
    suggestedResources: []
  },
  {
    githubNumber: 47821,
    repoOwner: "grafana",
    repoName: "grafana",
    title: "Fix dashboard panel loading flicker on refresh",
    body: "When auto-refresh is enabled, panels briefly show a loading skeleton even when data hasn't changed. This causes visual flicker that is distracting. We should diff the response and only re-render if data actually changed.",
    summary: "Dashboard panels flicker on auto-refresh even when data is unchanged.",
    labels: ["TypeScript", "Bug", "UI/UX"],
    status: "open" as const,
    githubUrl: "https://github.com/grafana/grafana/issues/47821",
    githubCreatedAt: daysAgo(2),
    githubUpdatedAt: daysAgo(0),
    openedAt: daysAgo(2),
    requiredSkills: ["TypeScript", "React", "Data Visualization"],
    expectedOutcome: ["Eliminate panel flicker by diffing responses before re-rendering."],
    beginnerFriendly: false,
    activeMaintainer: true,
    recentlyUpdated: true,
    repoHealth: { healthScore: 89, activityScore: 94, openIssues: 3200, recentCommits: 150 },
    prStatus: "NONE" as const,
    updates: [],
    contributionTimeline: [],
    notifyWatchers: [],
    autoSetupCommands: [],
    projectSetupCommands: [],
    suggestedResources: []
  },
  {
    githubNumber: 15632,
    repoOwner: "fastapi",
    repoName: "fastapi",
    title: "Add built-in rate limiting middleware",
    body: "FastAPI lacks a built-in rate limiting solution. Developers currently rely on third-party packages like slowapi. Adding a native middleware with configurable limits per route would improve the developer experience significantly.",
    summary: "No built-in rate limiting middleware in FastAPI.",
    labels: ["Python", "Feature Request", "Middleware"],
    status: "open" as const,
    githubUrl: "https://github.com/fastapi/fastapi/issues/15632",
    githubCreatedAt: daysAgo(7),
    githubUpdatedAt: daysAgo(4),
    openedAt: daysAgo(7),
    requiredSkills: ["Python", "FastAPI", "Starlette"],
    expectedOutcome: ["Implement configurable rate limiting middleware with per-route support."],
    beginnerFriendly: false,
    activeMaintainer: true,
    recentlyUpdated: true,
    repoHealth: { healthScore: 91, activityScore: 85, openIssues: 600, recentCommits: 30 },
    prStatus: "NONE" as const,
    updates: [],
    contributionTimeline: [],
    notifyWatchers: [],
    autoSetupCommands: [],
    projectSetupCommands: [],
    suggestedResources: []
  },
  {
    githubNumber: 27113,
    repoOwner: "vuejs",
    repoName: "vue",
    title: "Improve Teleport component with transition support",
    body: "Currently, using <Transition> inside <Teleport> can cause inconsistent behavior, especially when teleporting to elements that are conditionally rendered. The transition hooks fire before the target DOM node is ready.",
    summary: "Transition hooks fire prematurely inside conditionally rendered Teleport targets.",
    labels: ["JavaScript", "Bug", "Components"],
    status: "open" as const,
    githubUrl: "https://github.com/vuejs/vue/issues/27113",
    githubCreatedAt: daysAgo(3),
    githubUpdatedAt: daysAgo(1),
    openedAt: daysAgo(3),
    requiredSkills: ["Vue.js", "JavaScript", "DOM APIs"],
    expectedOutcome: ["Fix Transition behavior inside conditionally rendered Teleport targets."],
    beginnerFriendly: false,
    activeMaintainer: true,
    recentlyUpdated: true,
    repoHealth: { healthScore: 90, activityScore: 82, openIssues: 350, recentCommits: 25 },
    prStatus: "NONE" as const,
    updates: [],
    contributionTimeline: [],
    notifyWatchers: [],
    autoSetupCommands: [],
    projectSetupCommands: [],
    suggestedResources: []
  },
  {
    githubNumber: 5578,
    repoOwner: "prisma",
    repoName: "prisma",
    title: "Add README examples for nested create with relations",
    body: "The getting started guide doesn't show how to create records with nested relations in a single query. Adding examples for one-to-many and many-to-many nested creates would help newcomers.",
    summary: "Getting started docs missing nested relation create examples.",
    labels: ["TypeScript", "Documentation", "Good First Issue"],
    status: "open" as const,
    githubUrl: "https://github.com/prisma/prisma/issues/5578",
    githubCreatedAt: daysAgo(8),
    githubUpdatedAt: daysAgo(5),
    openedAt: daysAgo(8),
    requiredSkills: ["Prisma", "TypeScript", "Technical Writing"],
    expectedOutcome: ["Add nested create examples to the documentation."],
    beginnerFriendly: true,
    activeMaintainer: true,
    recentlyUpdated: true,
    repoHealth: { healthScore: 87, activityScore: 80, openIssues: 2800, recentCommits: 45 },
    prStatus: "NONE" as const,
    updates: [],
    contributionTimeline: [],
    notifyWatchers: [],
    autoSetupCommands: [],
    projectSetupCommands: [],
    suggestedResources: []
  },
  {
    githubNumber: 9102,
    repoOwner: "golang",
    repoName: "go",
    title: "Proposal: add slices.Chunk for splitting slices into batches",
    body: "Many Go programs need to split slices into fixed-size chunks for batch processing. Currently everyone writes their own helper. Proposing slices.Chunk(s []T, size int) [][]T in the standard library.",
    summary: "Proposal to add a slices.Chunk function to the Go standard library.",
    labels: ["Go", "Proposal", "Standard Library"],
    status: "open" as const,
    githubUrl: "https://github.com/golang/go/issues/9102",
    githubCreatedAt: daysAgo(10),
    githubUpdatedAt: daysAgo(3),
    openedAt: daysAgo(10),
    requiredSkills: ["Go", "Standard Library", "API Design"],
    expectedOutcome: ["Implement and test slices.Chunk with proper edge case handling."],
    beginnerFriendly: false,
    activeMaintainer: true,
    recentlyUpdated: true,
    repoHealth: { healthScore: 97, activityScore: 99, openIssues: 9000, recentCommits: 300 },
    prStatus: "NONE" as const,
    updates: [],
    contributionTimeline: [],
    notifyWatchers: [],
    autoSetupCommands: [],
    projectSetupCommands: [],
    suggestedResources: []
  },
  {
    githubNumber: 3344,
    repoOwner: "denoland",
    repoName: "deno",
    title: "Add CONTRIBUTING.md with local build instructions",
    body: "New contributors are confused about how to build Deno from source. We need a clear CONTRIBUTING.md that covers prerequisites (Rust toolchain, protobuf), build steps, and how to run the test suite.",
    summary: "Missing CONTRIBUTING.md with build-from-source instructions.",
    labels: ["Rust", "Documentation", "Good First Issue"],
    status: "open" as const,
    githubUrl: "https://github.com/denoland/deno/issues/3344",
    githubCreatedAt: daysAgo(12),
    githubUpdatedAt: daysAgo(6),
    openedAt: daysAgo(12),
    requiredSkills: ["Rust", "Deno", "Technical Writing"],
    expectedOutcome: ["Create CONTRIBUTING.md with clear build and test instructions."],
    beginnerFriendly: true,
    activeMaintainer: true,
    recentlyUpdated: true,
    repoHealth: { healthScore: 91, activityScore: 93, openIssues: 1600, recentCommits: 80 },
    prStatus: "NONE" as const,
    updates: [],
    contributionTimeline: [],
    notifyWatchers: [],
    autoSetupCommands: [],
    projectSetupCommands: [],
    suggestedResources: []
  },
  {
    githubNumber: 7821,
    repoOwner: "remix-run",
    repoName: "remix",
    title: "Fix loader data serialization with Date objects",
    body: "When returning Date objects from a loader, they get serialized to strings but the TypeScript types still show them as Date. This causes runtime errors when calling .getTime() on what is actually a string.",
    summary: "Loader Date objects become strings after serialization but types don't reflect this.",
    labels: ["TypeScript", "Bug", "Data Loading"],
    status: "open" as const,
    githubUrl: "https://github.com/remix-run/remix/issues/7821",
    githubCreatedAt: daysAgo(4),
    githubUpdatedAt: daysAgo(1),
    openedAt: daysAgo(4),
    requiredSkills: ["TypeScript", "Remix", "React Router"],
    expectedOutcome: ["Fix type inference for serialized loader data to match runtime types."],
    beginnerFriendly: false,
    activeMaintainer: true,
    recentlyUpdated: true,
    repoHealth: { healthScore: 85, activityScore: 78, openIssues: 520, recentCommits: 35 },
    prStatus: "NONE" as const,
    updates: [],
    contributionTimeline: [],
    notifyWatchers: [],
    autoSetupCommands: [],
    projectSetupCommands: [],
    suggestedResources: []
  }
];

/**
 * POST /api/seed-all
 * Seeds all demo data (resources + PR tracking + issues) for the current user.
 */
router.post("/", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    // Seed resources
    let resourcesInserted = 0;
    for (const item of SEED_RESOURCES) {
      const exists = await Resource.findOne({ url: item.url });
      if (!exists) {
        await Resource.create({
          ...(item as any),
          source: "official",
          status: "approved"
        });
        resourcesInserted++;
      }
    }

    // Seed PR tracking records
    const prIds: string[] = [];
    for (const demo of SEED_PRS) {
      const record = await PrTracking.findOneAndUpdate(
        {
          userId: req.userId,
          repoFullName: demo.repoFullName,
          issueNumber: demo.issueNumber
        },
        {
          $set: {
            userId: req.userId,
            ...demo,
            syncSource: "manual",
            lastSyncAt: new Date()
          }
        },
        { upsert: true, new: true }
      ).lean();
      prIds.push(String(record._id));
    }

    // Seed issues
    let issuesInserted = 0;
    for (const issue of SEED_ISSUES) {
      const exists = await Issue.findOne({
        repoOwner: issue.repoOwner,
        repoName: issue.repoName,
        githubNumber: issue.githubNumber
      });
      if (!exists) {
        await Issue.create(issue);
        issuesInserted++;
      }
    }

    return res.json({
      message: "All demo data seeded successfully",
      resources: { inserted: resourcesInserted },
      prTracking: { inserted: prIds.length, ids: prIds },
      issues: { inserted: issuesInserted }
    });
  } catch (err) {
    console.error("POST /api/seed-all error:", err);
    return res.status(500).json({ message: "Failed to seed demo data" });
  }
});

export default router;
