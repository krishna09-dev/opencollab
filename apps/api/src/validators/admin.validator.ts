import { z } from "zod";

export const addRepoSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .regex(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/, "Must be in format owner/repo")
  })
});

export const updateRepoSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    isActive: z.boolean().optional(),
    description: z.string().optional()
  })
});

export const repoIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const listIssuesAdminSchema = z.object({
  query: z.object({
    page: z.string().default("1"),
    limit: z.string().default("20"),
    status: z.enum(["open", "claimed", "closed"]).optional(),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    isApproved: z.enum(["true", "false"]).optional(),
    isVisible: z.enum(["true", "false"]).optional(),
    search: z.string().optional(),
    repoFullName: z.string().optional()
  })
});

export const updateIssueAdminSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    isApproved: z.boolean().optional(),
    isVisible: z.boolean().optional(),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional()
  })
});

export const issueIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

// Claims monitoring schemas
export const listClaimedIssuesSchema = z.object({
  query: z.object({
    page: z.string().default("1"),
    limit: z.string().default("20"),
    staleOnly: z.enum(["true", "false"]).optional(),
    staleDays: z.string().default("7"),
    search: z.string().optional(),
    repoFullName: z.string().optional()
  })
});

export const forceReleaseClaimSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    reason: z.string().optional()
  })
});

// PR verification schemas
export const listPrTrackingAdminSchema = z.object({
  query: z.object({
    page: z.string().default("1"),
    limit: z.string().default("20"),
    isVerified: z.enum(["true", "false"]).optional(),
    isValid: z.enum(["true", "false"]).optional(),
    status: z.enum(["ACCEPTED", "PR_OPEN", "MERGED", "CLOSED"]).optional(),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    search: z.string().optional(),
    repoFullName: z.string().optional()
  })
});

export const verifyPrSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    isValid: z.boolean(),
    note: z.string().optional()
  })
});

export const prIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});
