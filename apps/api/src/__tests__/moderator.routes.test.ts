import request from "supertest";
import { RepoRequest } from "../models/RepoRequest";
import { Resource } from "../models/Resource";
import { authHeaderForUserId, createUser, getTestApp } from "./testUtils";

describe("Moderator routes", () => {
  test("GET /api/moderator/repo-requests rejects request without token", async () => {
    const app = getTestApp();

    const res = await request(app).get("/api/moderator/repo-requests");

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/no token provided/i);
  });

  test("GET /api/moderator/repo-requests rejects non-moderator user", async () => {
    const app = getTestApp();
    const user = await createUser("user");

    const res = await request(app)
      .get("/api/moderator/repo-requests")
      .set(authHeaderForUserId(String(user._id)));

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/moderator or admin access required/i);
  });

  test("GET /api/moderator/repo-requests returns only caller requests and supports status filter", async () => {
    const app = getTestApp();
    const moderator = await createUser("moderator");
    const anotherModerator = await createUser("moderator");

    await RepoRequest.create({
      fullName: "octocat/alpha",
      fullNameNormalized: "octocat/alpha",
      repoOwner: "octocat",
      repoName: "alpha",
      requestedById: moderator._id,
      requestedByModel: "User",
      requestedByLogin: moderator.login,
      requestedByRole: "moderator",
      status: "pending"
    });

    await RepoRequest.create({
      fullName: "octocat/beta",
      fullNameNormalized: "octocat/beta",
      repoOwner: "octocat",
      repoName: "beta",
      requestedById: moderator._id,
      requestedByModel: "User",
      requestedByLogin: moderator.login,
      requestedByRole: "moderator",
      status: "approved"
    });

    await RepoRequest.create({
      fullName: "octocat/gamma",
      fullNameNormalized: "octocat/gamma",
      repoOwner: "octocat",
      repoName: "gamma",
      requestedById: anotherModerator._id,
      requestedByModel: "User",
      requestedByLogin: anotherModerator.login,
      requestedByRole: "moderator",
      status: "pending"
    });

    const res = await request(app)
      .get("/api/moderator/repo-requests?status=pending&page=1&limit=10")
      .set(authHeaderForUserId(String(moderator._id)));

    expect(res.status).toBe(200);
    expect(res.body.requests).toHaveLength(1);
    expect(res.body.requests[0].fullName).toBe("octocat/alpha");
    expect(res.body.pagination.total).toBe(1);
  });

  test("GET /api/moderator/resource-requests returns only caller community requests", async () => {
    const app = getTestApp();
    const moderator = await createUser("moderator");
    const anotherModerator = await createUser("moderator");

    await Resource.create({
      title: "Pending community request",
      url: "https://example.com/mod-resource-pending",
      description: "Pending request",
      category: "Programming Docs",
      type: "article",
      difficulty: "beginner",
      source: "community",
      status: "pending",
      submittedBy: moderator._id
    });

    await Resource.create({
      title: "Approved community request",
      url: "https://example.com/mod-resource-approved",
      description: "Approved request",
      category: "Programming Docs",
      type: "article",
      difficulty: "beginner",
      source: "community",
      status: "approved",
      submittedBy: moderator._id
    });

    await Resource.create({
      title: "Other moderator request",
      url: "https://example.com/mod-resource-other",
      description: "Other moderator request",
      category: "Programming Docs",
      type: "article",
      difficulty: "beginner",
      source: "community",
      status: "pending",
      submittedBy: anotherModerator._id
    });

    await Resource.create({
      title: "Official resource",
      url: "https://example.com/mod-resource-official",
      description: "Official resource",
      category: "Programming Docs",
      type: "article",
      difficulty: "beginner",
      source: "official",
      status: "pending",
      submittedBy: moderator._id
    });

    const res = await request(app)
      .get("/api/moderator/resource-requests?status=pending&page=1&limit=10")
      .set(authHeaderForUserId(String(moderator._id)));

    expect(res.status).toBe(200);
    expect(res.body.requests).toHaveLength(1);
    expect(res.body.requests[0].title).toBe("Pending community request");
    expect(res.body.pagination.total).toBe(1);
  });
});
