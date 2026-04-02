import { Router, Response } from "express";
import axios from "axios";
import { AuthRequest, authRequired } from "../middleware/auth";
import { moderatorOrAdminRequired } from "../middleware/adminAuth";
import { validate } from "../middleware/validate";
import {
  createRepoRequestSchema,
  listModeratorRepoRequestsSchema,
  listModeratorResourceRequestsSchema
} from "../validators/requests.validator";
import { RepoRequest, type IdentityModel, type ModeratorRole } from "../models/RepoRequest";
import { ApprovedRepo } from "../models/ApprovedRepo";
import { AdminUser } from "../models/AdminUser";
import { User } from "../models/User";
import { Resource } from "../models/Resource";

const router = Router();

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toExactCaseInsensitiveRegex(value: string) {
  return new RegExp(`^${escapeRegex(value)}$`, "i");
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
router.use(moderatorOrAdminRequired);

// POST /api/moderator/repo-requests
router.post(
  "/repo-requests",
  validate(createRepoRequestSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const actor = await resolveActorIdentity(req.userId);
      if (!actor) {
        return res.status(403).json({ message: "Moderator access required" });
      }

      let githubToken: string | undefined;
      if (actor.role === "moderator") {
        if (actor.model !== "User") {
          return res.status(400).json({
            message: "Moderator GitHub token unavailable. Please sign in via /moderation."
          });
        }

        const moderator = await User.findById(actor.id).select("githubAccessToken");
        githubToken = moderator?.githubAccessToken || undefined;

        if (!githubToken) {
          return res.status(400).json({
            message: "Moderator GitHub token is missing. Please log out and sign in again via /moderation."
          });
        }
      }

      const { fullName, requestNotes } = req.validated!.body;
      const [ownerInput, repoInput] = String(fullName).split("/");

      let repoOwner = ownerInput;
      let repoName = repoInput;
      let description: string | null = null;
      let htmlUrl: string | null = null;
      let language: string | null = null;

      try {
        const ghRes = await axios.get(`https://api.github.com/repos/${ownerInput}/${repoInput}`, {
          headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "opencollab-app",
            ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {})
          }
        });

        repoOwner = String(ghRes.data.owner?.login || ownerInput);
        repoName = String(ghRes.data.name || repoInput);
        description = ghRes.data.description || null;
        htmlUrl = ghRes.data.html_url || null;
        language = ghRes.data.language || null;
      } catch (ghErr: any) {
        if (ghErr?.response?.status === 404) {
          return res.status(404).json({ message: "Repository not found on GitHub" });
        }
      }

      const resolvedFullName = `${repoOwner}/${repoName}`;
      const fullNameNormalized = resolvedFullName.toLowerCase();

      const existingApproved = await ApprovedRepo.findOne({
        repoOwner: { $regex: toExactCaseInsensitiveRegex(repoOwner) },
        repoName: { $regex: toExactCaseInsensitiveRegex(repoName) }
      }).lean();

      if (existingApproved) {
        return res.status(409).json({ message: "Repository is already available in OpenCollab" });
      }

      const existingPending = await RepoRequest.findOne({
        fullNameNormalized,
        status: "pending"
      }).lean();

      if (existingPending) {
        return res.status(409).json({ message: "Repository has already been requested and is pending review" });
      }

      const repoRequest = await RepoRequest.create({
        fullName: resolvedFullName,
        fullNameNormalized,
        repoOwner,
        repoName,
        description,
        htmlUrl,
        language,
        requestNotes: requestNotes?.trim() || null,
        requestedById: actor.id,
        requestedByModel: actor.model,
        requestedByLogin: actor.login,
        requestedByRole: actor.role,
        status: "pending"
      });

      return res.status(201).json({
        message: "Repository request submitted for admin approval",
        request: repoRequest
      });
    } catch (err) {
      console.error("POST /api/moderator/repo-requests error:", err);
      return res.status(500).json({ message: "Failed to submit repository request" });
    }
  }
);

// GET /api/moderator/repo-requests
router.get(
  "/repo-requests",
  validate(listModeratorRepoRequestsSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page, limit, status } = req.validated!.query;
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const skip = (pageNum - 1) * limitNum;

      const filter: Record<string, unknown> = {
        requestedById: req.userId
      };

      if (status) {
        filter.status = status;
      }

      const [requests, total] = await Promise.all([
        RepoRequest.find(filter)
          .sort({ createdAt: -1 })
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
      console.error("GET /api/moderator/repo-requests error:", err);
      return res.status(500).json({ message: "Failed to load repository requests" });
    }
  }
);

// GET /api/moderator/resource-requests
router.get(
  "/resource-requests",
  validate(listModeratorResourceRequestsSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page, limit, status } = req.validated!.query;
      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const skip = (pageNum - 1) * limitNum;

      const filter: Record<string, unknown> = {
        submittedBy: req.userId,
        source: "community"
      };

      if (status) {
        filter.status = status;
      }

      const [requests, total] = await Promise.all([
        Resource.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .select(
            "_id title url description category type difficulty tags topics language " +
              "status source isFeatured qualityScore createdAt updatedAt " +
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
      console.error("GET /api/moderator/resource-requests error:", err);
      return res.status(500).json({ message: "Failed to load resource requests" });
    }
  }
);

export default router;
