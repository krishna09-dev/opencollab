import { z } from "zod";

// GET /api/issues - List issues with pagination/filters
export const listIssuesSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default("1"),
    limit: z.string().regex(/^\d+$/).optional().default("10"),
    status: z.enum(["open", "claimed", "closed"]).optional(),
    language: z.string().max(200).optional(),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    search: z.string().max(200).optional(),
    sort: z.enum(["newest", "oldest", "recently-created"]).optional().default("newest")
  }),
  params: z.object({}),
  body: z.object({})
});

export type ListIssuesInput = z.infer<typeof listIssuesSchema>;

// GET /api/issues/:id - Get single issue
export const getIssueSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Issue ID is required")
  }),
  query: z.object({}),
  body: z.object({})
});

export type GetIssueInput = z.infer<typeof getIssueSchema>;

// POST /api/issues/:id/claim
export const claimIssueSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Issue ID is required")
  }),
  query: z.object({}),
  body: z.object({})
});

export type ClaimIssueInput = z.infer<typeof claimIssueSchema>;

// POST /api/issues/:id/refresh
export const refreshIssueSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Issue ID is required")
  }),
  query: z.object({}),
  body: z.object({})
});

export type RefreshIssueInput = z.infer<typeof refreshIssueSchema>;

// POST /api/issues/:id/abort
export const abortIssueSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Issue ID is required")
  }),
  query: z.object({}),
  body: z.object({})
});

export type AbortIssueInput = z.infer<typeof abortIssueSchema>;

// POST /api/issues/:id/notify
export const notifyIssueSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Issue ID is required")
  }),
  query: z.object({}),
  body: z.object({})
});

export type NotifyIssueInput = z.infer<typeof notifyIssueSchema>;
