import { AdminUser } from "../models/AdminUser";
import { RepoRequest } from "../models/RepoRequest";
import { User } from "../models/User";

export type ModerationIdentityModel = "User" | "AdminUser";
export type ModerationRole = "admin" | "moderator";

export interface ModerationActor {
  id: string;
  model: ModerationIdentityModel;
  login: string;
  role: ModerationRole;
}

export interface RepoScopeItem {
  repoOwner: string;
  repoName: string;
  fullName: string;
  fullNameLower: string;
}

export interface ModerationScope {
  actor: ModerationActor;
  isAdmin: boolean;
  allowedRepos: RepoScopeItem[];
  allowedRepoNamesLower: Set<string>;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toExactCaseInsensitiveRegex(value: string) {
  return new RegExp(`^${escapeRegex(value)}$`, "i");
}

function appendAndCondition(filter: Record<string, any>, condition: Record<string, any>) {
  if (Array.isArray(filter.$and)) {
    filter.$and.push(condition);
  } else {
    filter.$and = [condition];
  }
}

export async function resolveModerationActor(userId: string): Promise<ModerationActor | null> {
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

export async function getModerationScope(userId: string): Promise<ModerationScope | null> {
  const actor = await resolveModerationActor(userId);
  if (!actor) return null;

  if (actor.role === "admin") {
    return {
      actor,
      isAdmin: true,
      allowedRepos: [],
      allowedRepoNamesLower: new Set<string>()
    };
  }

  const requests = await RepoRequest.find({
    requestedById: actor.id,
    requestedByModel: actor.model,
    status: "approved"
  })
    .select("repoOwner repoName fullName fullNameNormalized")
    .lean();

  const dedup = new Map<string, RepoScopeItem>();

  requests.forEach((request: any) => {
    const owner = String(request.repoOwner || "").trim();
    const name = String(request.repoName || "").trim();
    const fullNameRaw = String(request.fullName || "").trim();

    if (!owner || !name) return;

    const fullName = fullNameRaw || `${owner}/${name}`;
    const fullNameLower = String(request.fullNameNormalized || fullName.toLowerCase());

    if (!dedup.has(fullNameLower)) {
      dedup.set(fullNameLower, {
        repoOwner: owner,
        repoName: name,
        fullName,
        fullNameLower
      });
    }
  });

  const allowedRepos = Array.from(dedup.values());
  const allowedRepoNamesLower = new Set(allowedRepos.map((repo) => repo.fullNameLower));

  return {
    actor,
    isAdmin: false,
    allowedRepos,
    allowedRepoNamesLower
  };
}

export function applyIssueRepoScope(filter: Record<string, any>, scope: ModerationScope) {
  if (scope.isAdmin) return;

  if (scope.allowedRepos.length === 0) {
    appendAndCondition(filter, { _id: { $exists: false } });
    return;
  }

  const repoConditions = scope.allowedRepos.map((repo) => ({
    repoOwner: { $regex: toExactCaseInsensitiveRegex(repo.repoOwner) },
    repoName: { $regex: toExactCaseInsensitiveRegex(repo.repoName) }
  }));

  appendAndCondition(filter, { $or: repoConditions });
}

export function applyRepoFullNameScope(
  filter: Record<string, any>,
  scope: ModerationScope,
  field: string = "repoFullName"
) {
  if (scope.isAdmin) return;

  if (scope.allowedRepos.length === 0) {
    appendAndCondition(filter, { _id: { $exists: false } });
    return;
  }

  const repoConditions = scope.allowedRepos.map((repo) => ({
    [field]: { $regex: toExactCaseInsensitiveRegex(repo.fullName) }
  }));

  appendAndCondition(filter, { $or: repoConditions });
}

export function canAccessRepoByOwnerName(
  scope: ModerationScope,
  repoOwner: string,
  repoName: string
) {
  if (scope.isAdmin) return true;
  const fullNameLower = `${String(repoOwner || "").trim()}/${String(repoName || "").trim()}`.toLowerCase();
  return scope.allowedRepoNamesLower.has(fullNameLower);
}

export function canAccessRepoFullName(scope: ModerationScope, repoFullName: string) {
  if (scope.isAdmin) return true;
  return scope.allowedRepoNamesLower.has(String(repoFullName || "").trim().toLowerCase());
}
