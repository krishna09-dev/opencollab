import { z } from "zod";

// POST /api/pr-tracking/add - Add PR by URL
export const addPrByUrlSchema = z.object({
  body: z.object({
    prUrl: z.string().min(1, "PR URL is required")
  }),
  params: z.object({}),
  query: z.object({})
});

export type AddPrByUrlInput = z.infer<typeof addPrByUrlSchema>;

// POST /api/pr-tracking/ensure - Ensure PR tracking exists
export const ensureTrackingSchema = z.object({
  body: z.object({
    repoFullName: z.string().min(1, "repoFullName is required"),
    issueNumber: z.union([z.number(), z.string()]).transform((val) => Number(val)),
    issueTitle: z.string().optional()
  }),
  params: z.object({}),
  query: z.object({})
});

export type EnsureTrackingInput = z.infer<typeof ensureTrackingSchema>;

// POST /api/pr-tracking/refresh - Refresh PR tracking
export const refreshTrackingSchema = z.object({
  body: z.object({
    id: z.string().optional()
  }),
  params: z.object({}),
  query: z.object({})
});

export type RefreshTrackingInput = z.infer<typeof refreshTrackingSchema>;

// GET /api/pr-tracking/:id - Get single tracking by ID
export const getTrackingByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Tracking ID is required")
  }),
  body: z.object({}),
  query: z.object({})
});

export type GetTrackingByIdInput = z.infer<typeof getTrackingByIdSchema>;

// POST /api/pr-tracking/submit - Submit PR for an issue
export const submitPrSchema = z.object({
  body: z.object({
    issueId: z.string().min(1, "Issue ID is required"),
    prUrl: z.string().min(1, "PR URL is required")
  }),
  params: z.object({}),
  query: z.object({})
});

export type SubmitPrInput = z.infer<typeof submitPrSchema>;

// POST /api/pr-tracking/:id/refresh - Refresh single PR by tracking ID
export const refreshByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Tracking ID is required")
  }),
  body: z.object({}),
  query: z.object({})
});

export type RefreshByIdInput = z.infer<typeof refreshByIdSchema>;

// GET /api/pr-tracking/issue/:issueId - Get PR tracking by issue ID
export const getByIssueIdSchema = z.object({
  params: z.object({
    issueId: z.string().min(1, "Issue ID is required")
  }),
  body: z.object({}),
  query: z.object({})
});

export type GetByIssueIdInput = z.infer<typeof getByIssueIdSchema>;
