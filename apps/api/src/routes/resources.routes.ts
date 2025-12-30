// apps/api/src/routes/resources.routes.ts
import { Router, Response } from "express";
import { AuthRequest, authRequired } from "../middleware/auth";
import { Resource } from "../models/Resource";

const router = Router();

type ResourceSource = "official" | "community";
type ResourceStatus = "approved" | "pending" | "rejected";

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((x: unknown) => String(x).trim())
    .filter((x: string) => x.length > 0);
}

/**
 * GET /api/resources
 * Default: returns APPROVED resources (official + community)
 * Optional: source=official|community
 */
router.get("/", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    const q = (req.query.q as string | undefined)?.trim();
    const type = (req.query.type as string | undefined)?.trim();
    const difficulty = (req.query.difficulty as string | undefined)?.trim();
    const topic = (req.query.topic as string | undefined)?.trim();
    const tag = (req.query.tag as string | undefined)?.trim();
    const featured = (req.query.featured as string | undefined)?.trim();
    const source = (req.query.source as string | undefined)?.trim() as ResourceSource | undefined;

    const limit = Math.min(Number(req.query.limit ?? 40) || 40, 100);
    const page = Math.max(Number(req.query.page ?? 1) || 1, 1);
    const skip = (page - 1) * limit;

    // ✅ show approved only (UI library)
    const filter: Record<string, unknown> = { status: "approved" as ResourceStatus };

    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;

    if (source === "official" || source === "community") filter.source = source;

    if (topic) filter.topics = { $in: [topic] };
    if (tag) filter.tags = { $in: [tag] };

    if (featured === "true") filter.isFeatured = true;
    if (featured === "false") filter.isFeatured = false;

    const query = q ? { ...filter, $text: { $search: q } } : filter;

    const total = await Resource.countDocuments(query);

    const sort = q
      ? { score: { $meta: "textScore" }, isFeatured: -1, qualityScore: -1, createdAt: -1 }
      : { isFeatured: -1, qualityScore: -1, createdAt: -1 };

    const items = await Resource.find(query, q ? { score: { $meta: "textScore" } } : {})
      .sort(sort as any)
      .skip(skip)
      .limit(limit)
      .lean();

    const featuredList = await Resource.find({ status: "approved", isFeatured: true })
      .sort({ qualityScore: -1, createdAt: -1 })
      .limit(8)
      .lean();

    return res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      featured: featuredList,
      items
    });
  } catch (err) {
    console.error("GET /api/resources error:", err);
    return res.status(500).json({ message: "Failed to load resources" });
  }
});

/**
 * POST /api/resources/seed
 * Creates OFFICIAL + APPROVED items (if missing)
 */
router.post("/seed", authRequired, async (_req: AuthRequest, res: Response) => {
  try {
    const seed = [
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

    let inserted = 0;

    for (const item of seed) {
      const exists = await Resource.findOne({ url: item.url });
      if (!exists) {
        await Resource.create({
          ...(item as any),
          source: "official",
          status: "approved"
        });
        inserted++;
      }
    }

    return res.json({ message: "Seed complete", inserted });
  } catch (err) {
    console.error("POST /api/resources/seed error:", err);
    return res.status(500).json({ message: "Failed to seed resources" });
  }
});

/**
 * POST /api/resources/suggest
 * Creates COMMUNITY + PENDING resource
 */
router.post("/suggest", authRequired, async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body ?? {};

    const title = String(body.title ?? "").trim();
    const url = String(body.url ?? "").trim();
    const description = String(body.description ?? "").trim();

    const type = String(body.type ?? "article").trim();
    const difficulty = String(body.difficulty ?? "beginner").trim();

    const tags = normalizeStringArray(body.tags);
    const topics = normalizeStringArray(body.topics);

    const language = typeof body.language === "string" ? body.language.trim() : null;

    if (!title || !url || !description) {
      return res.status(400).json({ message: "title, url, description are required" });
    }

    const exists = await Resource.findOne({ url });
    if (exists) {
      return res.status(409).json({ message: "This resource already exists." });
    }

    const doc = await Resource.create({
      title,
      url,
      description,
      type,
      difficulty,
      tags,
      topics,
      language,
      isFeatured: false,
      qualityScore: 50,

      source: "community",
      status: "pending",

      // ✅ your AuthRequest has userId (not req.user)
      submittedBy: req.userId ?? null
    });

    return res.status(201).json({
      message: "Thanks! Your suggestion is submitted for review.",
      id: doc._id
    });
  } catch (err) {
    console.error("POST /api/resources/suggest error:", err);
    return res.status(500).json({ message: "Failed to submit suggestion" });
  }
});

/**
 * POST /api/resources/migrate
 * One-time migration: add default source/status to older docs
 * Safe to run multiple times.
 */
router.post("/migrate", authRequired, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await Resource.updateMany(
      { $or: [{ source: { $exists: false } }, { status: { $exists: false } }] },
      {
        $set: {
          source: "official",
          status: "approved"
        }
      }
    );

    return res.json({
      message: "Migration complete",
      matched: result.matchedCount ?? (result as any).n ?? 0,
      modified: result.modifiedCount ?? (result as any).nModified ?? 0
    });
  } catch (err) {
    console.error("POST /api/resources/migrate error:", err);
    return res.status(500).json({ message: "Failed to migrate resources" });
  }
});

export default router;