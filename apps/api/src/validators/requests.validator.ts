import { z } from "zod";

const RESOURCE_CATEGORIES = [
  "Git Basics",
  "Pull Requests",
  "Programming Docs",
  "CLI Mastery",
  "Bug Fixing"
] as const;

export const createRepoRequestSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .trim()
      .regex(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/, "Must be in format owner/repo"),
    requestNotes: z.string().trim().max(1000).optional()
  })
});

export const listModeratorRepoRequestsSchema = z.object({
  query: z.object({
    page: z.string().default("1"),
    limit: z.string().default("20"),
    status: z.enum(["pending", "approved", "rejected"]).optional()
  })
});

export const listModeratorResourceRequestsSchema = z.object({
  query: z.object({
    page: z.string().default("1"),
    limit: z.string().default("20"),
    status: z.enum(["pending", "approved", "rejected"]).optional()
  })
});

export const listAdminRepoRequestsSchema = z.object({
  query: z.object({
    page: z.string().default("1"),
    limit: z.string().default("20"),
    status: z.enum(["pending", "approved", "rejected"]).optional(),
    search: z.string().optional()
  })
});

export const approveRepoRequestSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    reviewNotes: z.string().trim().max(1000).optional(),
    syncNow: z.boolean().optional()
  })
});

export const rejectRepoRequestSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    reason: z.string().trim().max(1000).optional()
  })
});

export const listAdminResourceRequestsSchema = z.object({
  query: z.object({
    page: z.string().default("1"),
    limit: z.string().default("20"),
    status: z.enum(["pending", "approved", "rejected"]).optional(),
    search: z.string().optional()
  })
});

export const approveResourceRequestSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    reviewNotes: z.string().trim().max(1000).optional(),
    isFeatured: z.boolean().optional(),
    qualityScore: z.number().min(0).max(100).optional()
  })
});

export const rejectResourceRequestSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    reason: z.string().trim().max(1000).optional()
  })
});

export const createAdminResourceSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(200),
    url: z.string().trim().url("Invalid URL"),
    description: z.string().trim().min(1).max(1000),
    category: z.enum(RESOURCE_CATEGORIES),
    type: z.enum(["article", "docs", "video", "tool", "repo"]).optional().default("article"),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional().default("beginner"),
    tags: z.array(z.string()).optional().default([]),
    topics: z.array(z.string()).optional().default([]),
    language: z.string().nullable().optional(),
    isFeatured: z.boolean().optional(),
    qualityScore: z.number().min(0).max(100).optional()
  }),
  params: z.object({}),
  query: z.object({})
});

export const updateAdminResourceSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z
    .object({
      title: z.string().trim().min(1).max(200).optional(),
      url: z.string().trim().url("Invalid URL").optional(),
      description: z.string().trim().min(1).max(1000).optional(),
      category: z.enum(RESOURCE_CATEGORIES).optional(),
      type: z.enum(["article", "docs", "video", "tool", "repo"]).optional(),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
      tags: z.array(z.string()).optional(),
      topics: z.array(z.string()).optional(),
      language: z.string().nullable().optional(),
      isFeatured: z.boolean().optional(),
      qualityScore: z.number().min(0).max(100).optional()
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: "At least one field must be provided"
    }),
  query: z.object({})
});

export const deleteAdminResourceSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({}),
  query: z.object({})
});
