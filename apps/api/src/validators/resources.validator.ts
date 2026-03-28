import { z } from "zod";

// POST /api/resources/suggest - Suggest a new resource
export const suggestResourceSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required").max(200),
    url: z.string().url("Invalid URL"),
    description: z.string().min(1, "Description is required").max(1000),
    type: z.enum(["article", "docs", "video", "course", "tool"]).optional().default("article"),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional().default("beginner"),
    tags: z.array(z.string()).optional().default([]),
    topics: z.array(z.string()).optional().default([]),
    language: z.string().nullable().optional()
  }),
  params: z.object({}),
  query: z.object({})
});

export type SuggestResourceInput = z.infer<typeof suggestResourceSchema>;

// GET /api/resources - List resources with filters
export const listResourcesSchema = z.object({
  query: z.object({
    q: z.string().max(200).optional(),
    type: z.string().optional(),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    topic: z.string().optional(),
    tag: z.string().optional(),
    featured: z.enum(["true", "false"]).optional(),
    source: z.enum(["official", "community"]).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    page: z.string().regex(/^\d+$/).optional()
  }),
  params: z.object({}),
  body: z.object({})
});

export type ListResourcesInput = z.infer<typeof listResourcesSchema>;
