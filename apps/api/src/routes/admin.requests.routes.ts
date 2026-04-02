import { Router, Response } from "express";
import mongoose from "mongoose";
import { AuthRequest, authRequired } from "../middleware/auth";
import { adminRequired } from "../middleware/adminAuth";
import { validate } from "../middleware/validate";
import {
  approveRepoRequestSchema,
  approveResourceRequestSchema,
  createAdminResourceSchema,
  deleteAdminResourceSchema,
  listAdminRepoRequestsSchema,
  listAdminResourceRequestsSchema,
  rejectRepoRequestSchema,
  rejectResourceRequestSchema,
  updateAdminResourceSchema
} from "../validators/requests.validator";
import { RepoRequest, type IdentityModel, type ModeratorRole } from "../models/RepoRequest";
import { ApprovedRepo } from "../models/ApprovedRepo";
import { Resource, RESOURCE_CATEGORIES } from "../models/Resource";
import { User } from "../models/User";
import { AdminUser } from "../models/AdminUser";
import { ingestSingleRepo } from "../services/issueIngestion.service";

const router = Router();

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toExactCaseInsensitiveRegex(value: string) {
  return new RegExp(`^${escapeRegex(value)}$`, "i");
}

function normalizeStringList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];

  const dedup = new Set<string>();

  values.forEach((item) => {
    const normalized = String(item || "").trim();
    if (normalized) {
      dedup.add(normalized);
    }
  });

  return Array.from(dedup);
}

type ActorIdentity = {
  id: string;
  model: IdentityModel;
  login: string;
  role: ModeratorRole;
};

async function resolveActorIdentity(userId: string): Promise<ActorIdentity | null> {
  const user = await User.findById(userId).select("login role");
  if (user && (user.role === "admin" || user.role === "moderator")) {
    return {
      id: user._id.toString(),
      model: "User",
      login: user.login,
      role: user.role
    };
  }

  const adminUser = await AdminUser.findById(userId).select("username role");
  if (adminUser && (adminUser.role === "admin" || adminUser.role === "moderator")) {
    return {
      id: adminUser._id.toString(),
      model: "AdminUser",
      login: adminUser.username,
      role: adminUser.role
    };
  }

  return null;
}

router.use(authRequired);
router.use(adminRequired);

// GET /api/admin/repo-requests
router.get(
  "/repo-requests",
  validate(listAdminRepoRequestsSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page, limit, status, search } = req.validated!.query;
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const skip = (pageNum - 1) * limitNum;

      const filter: Record<string, any> = {};

      if (status) {
        filter.status = status;
      }

      if (search && search.trim()) {
        const q = search.trim();
        filter.$or = [
          { fullName: { $regex: new RegExp(q, "i") } },
          { requestedByLogin: { $regex: new RegExp(q, "i") } }
        ];
      }

      const [requests, total] = await Promise.all([
        RepoRequest.find(filter)
          .sort({ status: 1, createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        RepoRequest.countDocuments(filter)
      ]);

      return res.json({
        requests,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (err) {
      console.error("GET /api/admin/repo-requests error:", err);
      return res.status(500).json({ message: "Failed to load repository requests" });
    }
  }
);

// POST /api/admin/repo-requests/:id/approve
router.post(
  "/repo-requests/:id/approve",
  validate(approveRepoRequestSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.validated!.params;
      const { reviewNotes, syncNow } = req.validated!.body;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid request ID" });
      }

      const request = await RepoRequest.findById(id);
      if (!request) {
        return res.status(404).json({ message: "Repository request not found" });
      }

      if (request.status !== "pending") {
        return res.status(400).json({ message: "Only pending requests can be approved" });
      }

      let repo = await ApprovedRepo.findOne({
        repoOwner: { $regex: toExactCaseInsensitiveRegex(request.repoOwner) },
        repoName: { $regex: toExactCaseInsensitiveRegex(request.repoName) }
      });

      if (!repo) {
        repo = await ApprovedRepo.create({
          fullName: request.fullName,
          repoOwner: request.repoOwner,
          repoName: request.repoName,
          description: request.description,
          htmlUrl: request.htmlUrl,
          language: request.language,
          isActive: true
        });
      } else if (!repo.isActive) {
        repo.isActive = true;
        if (!repo.description && request.description) {
          repo.description = request.description;
        }
        if (!repo.htmlUrl && request.htmlUrl) {
          repo.htmlUrl = request.htmlUrl;
        }
        await repo.save();
      }

      const reviewer = await resolveActorIdentity(req.userId);
      request.status = "approved";
      request.approvedRepoId = repo._id;
      request.reviewNotes = reviewNotes?.trim() || null;
      request.reviewedAt = new Date();
      if (reviewer) {
        request.reviewedById = new mongoose.Types.ObjectId(reviewer.id);
        request.reviewedByModel = reviewer.model;
        request.reviewedByLogin = reviewer.login;
      }

      let syncResult: unknown = null;
      let syncError: string | null = null;
      const shouldSync = syncNow !== false;

      if (shouldSync) {
        try {
          syncResult = await ingestSingleRepo({
            fullName: repo.fullName,
            repoOwner: repo.repoOwner,
            repoName: repo.repoName,
            lastSyncedAt: null
          });
        } catch (err: any) {
          syncError = err?.message || "Repository approved, but initial sync failed";
        }
      }

      await request.save();

      return res.json({
        message: syncError
          ? "Repository approved. Initial sync failed. You can retry sync from repositories page."
          : "Repository approved successfully",
        request,
        repo,
        sync: shouldSync
          ? {
              success: !syncError,
              error: syncError,
              result: syncResult
            }
          : {
              skipped: true
            }
      });
    } catch (err) {
      console.error("POST /api/admin/repo-requests/:id/approve error:", err);
      return res.status(500).json({ message: "Failed to approve repository request" });
    }
  }
);

// POST /api/admin/repo-requests/:id/reject
router.post(
  "/repo-requests/:id/reject",
  validate(rejectRepoRequestSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.validated!.params;
      const { reason } = req.validated!.body;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid request ID" });
      }

      const request = await RepoRequest.findById(id);
      if (!request) {
        return res.status(404).json({ message: "Repository request not found" });
      }

      if (request.status !== "pending") {
        return res.status(400).json({ message: "Only pending requests can be rejected" });
      }

      const reviewer = await resolveActorIdentity(req.userId);
      request.status = "rejected";
      request.reviewNotes = reason?.trim() || null;
      request.reviewedAt = new Date();
      if (reviewer) {
        request.reviewedById = new mongoose.Types.ObjectId(reviewer.id);
        request.reviewedByModel = reviewer.model;
        request.reviewedByLogin = reviewer.login;
      }

      await request.save();

      return res.json({
        message: "Repository request rejected",
        request
      });
    } catch (err) {
      console.error("POST /api/admin/repo-requests/:id/reject error:", err);
      return res.status(500).json({ message: "Failed to reject repository request" });
    }
  }
);

// POST /api/admin/resources
// Admin-direct publish: creates official + approved resources visible immediately to users
router.post(
  "/resources",
  validate(createAdminResourceSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const {
        title,
        url,
        description,
        category,
        type,
        difficulty,
        tags,
        topics,
        language,
        isFeatured,
        qualityScore
      } = req.validated!.body;

      const normalizedUrl = String(url || "").trim();
      const existing = await Resource.findOne({ url: normalizedUrl }).lean();
      if (existing) {
        return res.status(409).json({ message: "This resource already exists." });
      }

      const reviewer = await resolveActorIdentity(req.userId);

      const resource = await Resource.create({
        title: String(title || "").trim(),
        url: normalizedUrl,
        description: String(description || "").trim(),
        category,
        type,
        difficulty,
        tags: normalizeStringList(tags),
        topics: normalizeStringList(topics),
        language: language ? String(language).trim() : null,
        isFeatured: Boolean(isFeatured),
        qualityScore: typeof qualityScore === "number" ? qualityScore : 80,
        source: "official",
        status: "approved",
        submittedBy: null,
        reviewedAt: new Date(),
        reviewNotes: "Published directly by admin",
        reviewedBy: reviewer ? new mongoose.Types.ObjectId(reviewer.id) : null,
        reviewedByModel: reviewer?.model || null,
        reviewedByLogin: reviewer?.login || null
      });

      return res.status(201).json({
        message: "Resource published and visible to users",
        resource
      });
    } catch (err) {
      console.error("POST /api/admin/resources error:", err);
      return res.status(500).json({ message: "Failed to publish resource" });
    }
  }
);

// PATCH /api/admin/resources/:id
// Admin-only update for approved resources visible in the admin approved-resources table
router.patch(
  "/resources/:id",
  validate(updateAdminResourceSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.validated!.params;
      const {
        title,
        url,
        description,
        category,
        type,
        difficulty,
        tags,
        topics,
        language,
        isFeatured,
        qualityScore
      } = req.validated!.body;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid resource ID" });
      }

      const resource = await Resource.findById(id);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }

      if (resource.status !== "approved") {
        return res.status(400).json({ message: "Only approved resources can be updated from this section" });
      }

      if (typeof url === "string") {
        const normalizedUrl = url.trim();
        if (normalizedUrl !== resource.url) {
          const duplicate = await Resource.findOne({
            _id: { $ne: resource._id },
            url: normalizedUrl
          })
            .select("_id")
            .lean();

          if (duplicate) {
            return res.status(409).json({ message: "Another resource already uses this URL." });
          }

          resource.url = normalizedUrl;
        }
      }

      if (typeof title === "string") resource.title = title.trim();
      if (typeof description === "string") resource.description = description.trim();
      if (category) resource.category = category;
      if (type) resource.type = type;
      if (difficulty) resource.difficulty = difficulty;
      if (Array.isArray(tags)) resource.tags = normalizeStringList(tags);
      if (Array.isArray(topics)) resource.topics = normalizeStringList(topics);
      if (language !== undefined) {
        resource.language = language ? String(language).trim() : null;
      }
      if (typeof isFeatured === "boolean") resource.isFeatured = isFeatured;
      if (typeof qualityScore === "number") resource.qualityScore = qualityScore;

      const reviewer = await resolveActorIdentity(req.userId);
      resource.reviewedAt = new Date();
      if (reviewer) {
        resource.reviewedBy = new mongoose.Types.ObjectId(reviewer.id);
        resource.reviewedByModel = reviewer.model;
        resource.reviewedByLogin = reviewer.login;
      }

      await resource.save();

      return res.json({
        message: "Approved resource updated",
        resource
      });
    } catch (err) {
      console.error("PATCH /api/admin/resources/:id error:", err);
      return res.status(500).json({ message: "Failed to update approved resource" });
    }
  }
);

// DELETE /api/admin/resources/:id
// Admin-only delete for approved resources
router.delete(
  "/resources/:id",
  validate(deleteAdminResourceSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.validated!.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid resource ID" });
      }

      const resource = await Resource.findById(id).select("status");
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }

      if (resource.status !== "approved") {
        return res.status(400).json({ message: "Only approved resources can be deleted from this section" });
      }

      await Resource.deleteOne({ _id: resource._id });

      return res.json({ message: "Approved resource deleted" });
    } catch (err) {
      console.error("DELETE /api/admin/resources/:id error:", err);
      return res.status(500).json({ message: "Failed to delete approved resource" });
    }
  }
);

// GET /api/admin/resource-requests
router.get(
  "/resource-requests",
  validate(listAdminResourceRequestsSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page, limit, status, search } = req.validated!.query;
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const skip = (pageNum - 1) * limitNum;

      const filter: Record<string, any> = {
        source: "community",
        status: status || "pending"
      };

      if (search && search.trim()) {
        const q = search.trim();
        filter.$or = [
          { title: { $regex: new RegExp(q, "i") } },
          { url: { $regex: new RegExp(q, "i") } },
          { description: { $regex: new RegExp(q, "i") } }
        ];
      }

      const [requests, total] = await Promise.all([
        Resource.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .select(
            "_id title url description category type difficulty tags topics language " +
              "status source isFeatured qualityScore submittedBy createdAt updatedAt " +
              "reviewNotes reviewedByLogin reviewedAt"
          )
          .lean(),
        Resource.countDocuments(filter)
      ]);

      return res.json({
        requests,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (err) {
      console.error("GET /api/admin/resource-requests error:", err);
      return res.status(500).json({ message: "Failed to load resource requests" });
    }
  }
);

// POST /api/admin/resource-requests/:id/approve
router.post(
  "/resource-requests/:id/approve",
  validate(approveResourceRequestSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.validated!.params;
      const { reviewNotes, isFeatured, qualityScore } = req.validated!.body;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid resource request ID" });
      }

      const resource = await Resource.findById(id);
      if (!resource) {
        return res.status(404).json({ message: "Resource request not found" });
      }

      const reviewer = await resolveActorIdentity(req.userId);
      resource.status = "approved";
      resource.source = "community";
      if (!resource.category || !RESOURCE_CATEGORIES.includes(resource.category as any)) {
        resource.category = "Programming Docs";
      }
      if (typeof isFeatured === "boolean") {
        resource.isFeatured = isFeatured;
      }
      if (typeof qualityScore === "number") {
        resource.qualityScore = qualityScore;
      }
      resource.reviewNotes = reviewNotes?.trim() || null;
      resource.reviewedAt = new Date();
      if (reviewer) {
        resource.reviewedBy = new mongoose.Types.ObjectId(reviewer.id);
        resource.reviewedByModel = reviewer.model;
        resource.reviewedByLogin = reviewer.login;
      }

      await resource.save();

      return res.json({
        message: "Resource request approved",
        resource
      });
    } catch (err) {
      console.error("POST /api/admin/resource-requests/:id/approve error:", err);
      return res.status(500).json({ message: "Failed to approve resource request" });
    }
  }
);

// POST /api/admin/resource-requests/:id/reject
router.post(
  "/resource-requests/:id/reject",
  validate(rejectResourceRequestSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.validated!.params;
      const { reason } = req.validated!.body;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid resource request ID" });
      }

      const resource = await Resource.findById(id);
      if (!resource) {
        return res.status(404).json({ message: "Resource request not found" });
      }

      const reviewer = await resolveActorIdentity(req.userId);
      resource.status = "rejected";
      if (!resource.category || !RESOURCE_CATEGORIES.includes(resource.category as any)) {
        resource.category = "Programming Docs";
      }
      resource.reviewNotes = reason?.trim() || null;
      resource.reviewedAt = new Date();
      if (reviewer) {
        resource.reviewedBy = new mongoose.Types.ObjectId(reviewer.id);
        resource.reviewedByModel = reviewer.model;
        resource.reviewedByLogin = reviewer.login;
      }

      await resource.save();

      return res.json({
        message: "Resource request rejected",
        resource
      });
    } catch (err) {
      console.error("POST /api/admin/resource-requests/:id/reject error:", err);
      return res.status(500).json({ message: "Failed to reject resource request" });
    }
  }
);

export default router;
