import { z } from "zod";

// PUT /api/me/preferences - Update user preferences
export const updatePreferencesSchema = z.object({
  body: z.object({
    preferredLanguages: z.array(z.string()).optional().default([]),
    experienceLevel: z.enum(["beginner", "intermediate", "advanced"]).optional().default("beginner"),
    areasOfInterest: z.array(z.string()).optional().default([])
  }),
  params: z.object({}),
  query: z.object({})
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

// PUT /api/me/profile - Update full user profile
export const updateProfileSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    preferredLanguages: z.array(z.string()).optional(),
    experienceLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    areasOfInterest: z.array(z.string()).optional()
  }),
  params: z.object({}),
  query: z.object({})
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// POST /api/me/saved-issues - Save an issue
export const saveIssueSchema = z.object({
  body: z.object({
    issueId: z.string().min(1),
    title: z.string().min(1).max(500),
    repoOwner: z.string().min(1).max(200),
    repoName: z.string().min(1).max(200),
    repoLanguage: z.string().max(100).optional().nullable(),
    labels: z.array(z.string()).optional().default([]),
    beginnerFriendly: z.boolean().optional().default(false)
  }),
  params: z.object({}),
  query: z.object({})
});

export type SaveIssueInput = z.infer<typeof saveIssueSchema>;

// DELETE /api/me/saved-issues/:issueId
export const unsaveIssueSchema = z.object({
  body: z.object({}),
  params: z.object({
    issueId: z.string().min(1)
  }),
  query: z.object({})
});

export type UnsaveIssueInput = z.infer<typeof unsaveIssueSchema>;

// GET /api/me/claimed-issues - List claimed issues for current user
export const listMyClaimedIssuesSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default("1"),
    limit: z.string().regex(/^\d+$/).optional().default("10"),
    search: z.string().max(200).optional(),
    status: z.enum(["all", "claimed", "closed"]).optional().default("all")
  })
});

export type ListMyClaimedIssuesInput = z.infer<typeof listMyClaimedIssuesSchema>;

// POST /api/me/recent-searches - Add a recent search
export const addRecentSearchSchema = z.object({
  body: z.object({
    query: z.string().min(1).max(200)
  }),
  params: z.object({}),
  query: z.object({})
});

export type AddRecentSearchInput = z.infer<typeof addRecentSearchSchema>;
