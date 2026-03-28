// apps/api/src/routes/resources.routes.ts
import { Router, Response } from "express";
import { AuthRequest, authRequired } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { listResourcesSchema, suggestResourceSchema } from "../validators/resources.validator";
import { Resource } from "../models/Resource";

const router = Router();

type ResourceSource = "official" | "community";
type ResourceStatus = "approved" | "pending" | "rejected";

/**
 * GET /api/resources
 * Default: returns APPROVED resources (official + community)
 * Optional: source=official|community
 */
router.get(
  "/",
  authRequired,
  validate(listResourcesSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { q, type, difficulty, topic, tag, featured, source, limit: limitStr, page: pageStr } = req.validated!.query;

      const limit = Math.min(Number(limitStr ?? 40) || 40, 100);
      const page = Math.max(Number(pageStr ?? 1) || 1, 1);
      const skip = (page - 1) * limit;

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
  }
);

/**
 * POST /api/resources/suggest
 * Creates COMMUNITY + PENDING resource
 */
router.post(
  "/suggest",
  authRequired,
  validate(suggestResourceSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { title, url, description, type, difficulty, tags, topics, language } = req.validated!.body;

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
        language: language ?? null,
        isFeatured: false,
        qualityScore: 50,
        source: "community",
        status: "pending",
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
  }
);

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
