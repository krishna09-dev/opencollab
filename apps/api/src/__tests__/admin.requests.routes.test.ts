import request from "supertest";
import { ApprovedRepo } from "../models/ApprovedRepo";
import { RepoRequest } from "../models/RepoRequest";
import { Resource } from "../models/Resource";
import {
  authHeaderForUserId,
  createUser,
  getTestApp
} from "./testUtils";

async function createPendingRepoRequest(overrides: Record<string, unknown> = {}) {
  const baseFullName = String(overrides.fullName || "acme/sample-repo");
  const [repoOwner, repoName] = baseFullName.split("/");

  return RepoRequest.create({
    fullName: baseFullName,
    fullNameNormalized: baseFullName.toLowerCase(),
    repoOwner,
    repoName,
    requestedById: overrides.requestedById,
    requestedByModel: overrides.requestedByModel || "User",
    requestedByLogin: overrides.requestedByLogin || "moderator-user",
    requestedByRole: overrides.requestedByRole || "moderator",
    status: "pending",
    ...overrides
  });
}

describe("Admin requests routes", () => {
  test("GET /api/admin/repo-requests denies non-admin users", async () => {
    const app = getTestApp();
    const user = await createUser("user");

    const res = await request(app)
      .get("/api/admin/repo-requests")
      .set(authHeaderForUserId(String(user._id)));

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/admin access required/i);
  });

  test("GET /api/admin/repo-requests returns paginated filtered requests", async () => {
    const app = getTestApp();
    const admin = await createUser("admin");

    await createPendingRepoRequest({
      fullName: "acme/visible-repo",
      requestedById: admin._id,
      requestedByLogin: "alice-mod"
    });

    await createPendingRepoRequest({
      fullName: "other/hidden-repo",
      requestedById: admin._id,
      requestedByLogin: "bob-mod"
    });

    const res = await request(app)
      .get("/api/admin/repo-requests?search=visible")
      .set(authHeaderForUserId(String(admin._id)));

    expect(res.status).toBe(200);
    expect(res.body.requests).toHaveLength(1);
    expect(res.body.requests[0].fullName).toBe("acme/visible-repo");
    expect(res.body.pagination.total).toBe(1);
  });

  test("repo request moderation supports approve and reject flows", async () => {
    const app = getTestApp();
    const admin = await createUser("admin");

    const approveRequest = await createPendingRepoRequest({
      fullName: "acme/approve-me",
      requestedById: admin._id,
      requestedByLogin: "alice-mod"
    });

    const approveRes = await request(app)
      .post(`/api/admin/repo-requests/${approveRequest._id}/approve`)
      .set(authHeaderForUserId(String(admin._id)))
      .send({ reviewNotes: "Looks good", syncNow: false });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.request.status).toBe("approved");
    expect(approveRes.body.sync.skipped).toBe(true);

    const approvedRepo = await ApprovedRepo.findOne({ fullName: "acme/approve-me" }).lean();
    expect(approvedRepo).not.toBeNull();

    const rejectRequest = await createPendingRepoRequest({
      fullName: "acme/reject-me",
      requestedById: admin._id,
      requestedByLogin: "charlie-mod"
    });

    const rejectRes = await request(app)
      .post(`/api/admin/repo-requests/${rejectRequest._id}/reject`)
      .set(authHeaderForUserId(String(admin._id)))
      .send({ reason: "Not aligned with project scope" });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.request.status).toBe("rejected");
    expect(rejectRes.body.request.reviewNotes).toBe("Not aligned with project scope");
  });

  test("admin resource management supports publish update and delete", async () => {
    const app = getTestApp();
    const admin = await createUser("admin");

    const createRes = await request(app)
      .post("/api/admin/resources")
      .set(authHeaderForUserId(String(admin._id)))
      .send({
        title: "CLI Handbook",
        url: "https://example.com/cli-handbook",
        description: "A practical guide to CLI workflows",
        category: "CLI Mastery",
        type: "article",
        difficulty: "beginner",
        tags: ["cli", "terminal"],
        topics: ["commands"],
        language: "TypeScript",
        isFeatured: true,
        qualityScore: 92
      });

    expect(createRes.status).toBe(201);
    const resourceId = createRes.body.resource._id;

    const updateRes = await request(app)
      .patch(`/api/admin/resources/${resourceId}`)
      .set(authHeaderForUserId(String(admin._id)))
      .send({
        title: "CLI Handbook Updated",
        qualityScore: 95,
        tags: ["cli", "shell", "workflow"]
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.resource.title).toBe("CLI Handbook Updated");
    expect(updateRes.body.resource.qualityScore).toBe(95);

    const deleteRes = await request(app)
      .delete(`/api/admin/resources/${resourceId}`)
      .set(authHeaderForUserId(String(admin._id)));

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toMatch(/approved resource deleted/i);

    const deleted = await Resource.findById(resourceId).lean();
    expect(deleted).toBeNull();
  });

  test("resource request moderation lists pending items and supports approve/reject", async () => {
    const app = getTestApp();
    const admin = await createUser("admin");

    const pendingA = await Resource.create({
      title: "Community Resource A",
      url: "https://example.com/community-a",
      description: "Pending community resource A",
      category: "Programming Docs",
      type: "article",
      difficulty: "beginner",
      source: "community",
      status: "pending"
    });

    const pendingB = await Resource.create({
      title: "Community Resource B",
      url: "https://example.com/community-b",
      description: "Pending community resource B",
      category: "Programming Docs",
      type: "article",
      difficulty: "beginner",
      source: "community",
      status: "pending"
    });

    const listRes = await request(app)
      .get("/api/admin/resource-requests?status=pending")
      .set(authHeaderForUserId(String(admin._id)));

    expect(listRes.status).toBe(200);
    expect(listRes.body.requests).toHaveLength(2);

    const approveRes = await request(app)
      .post(`/api/admin/resource-requests/${pendingA._id}/approve`)
      .set(authHeaderForUserId(String(admin._id)))
      .send({ reviewNotes: "Useful resource", qualityScore: 88, isFeatured: true });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.resource.status).toBe("approved");
    expect(approveRes.body.resource.isFeatured).toBe(true);

    const rejectRes = await request(app)
      .post(`/api/admin/resource-requests/${pendingB._id}/reject`)
      .set(authHeaderForUserId(String(admin._id)))
      .send({ reason: "Low quality content" });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.resource.status).toBe("rejected");
    expect(rejectRes.body.resource.reviewNotes).toBe("Low quality content");
  });
});
