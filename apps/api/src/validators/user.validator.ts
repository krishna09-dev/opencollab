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
