import request from "supertest";
import { User } from "../models/User";
import { authHeaderForUserId, createUser, getTestApp } from "./testUtils";

describe("User routes", () => {
  test("GET /api/me requires authentication", async () => {
    const app = getTestApp();

    const res = await request(app).get("/api/me");

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/no token provided/i);
  });

  test("GET /api/me returns the authenticated user profile", async () => {
    const app = getTestApp();
    const user = await createUser();

    const res = await request(app).get("/api/me").set(authHeaderForUserId(String(user._id)));

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(String(user._id));
    expect(res.body.login).toBe(user.login);
  });

  test("PUT /api/me/preferences updates profile preferences", async () => {
    const app = getTestApp();
    const user = await createUser();

    const res = await request(app)
      .put("/api/me/preferences")
      .set(authHeaderForUserId(String(user._id)))
      .send({
        preferredLanguages: ["TypeScript", "Python"],
        experienceLevel: "intermediate",
        areasOfInterest: ["backend", "open-source"]
      });

    expect(res.status).toBe(200);
    expect(res.body.user.preferredLanguages).toEqual(["TypeScript", "Python"]);
    expect(res.body.user.experienceLevel).toBe("intermediate");
    expect(res.body.user.areasOfInterest).toEqual(["backend", "open-source"]);

    const updated = await User.findById(user._id);
    expect(updated?.preferredLanguages).toEqual(["TypeScript", "Python"]);
  });

  test("GET /api/me/saved-issues returns empty list when user has none", async () => {
    const app = getTestApp();
    const user = await createUser();

    const res = await request(app)
      .get("/api/me/saved-issues")
      .set(authHeaderForUserId(String(user._id)));

    expect(res.status).toBe(200);
    expect(res.body.savedIssues).toEqual([]);
  });

  test("saved issues flow supports save, duplicate reject, and unsave", async () => {
    const app = getTestApp();
    const user = await createUser();
    const auth = authHeaderForUserId(String(user._id));

    const saveRes = await request(app)
      .post("/api/me/saved-issues")
      .set(auth)
      .send({
        issueId: "issue-123",
        title: "Fix onboarding bug",
        repoOwner: "octocat",
        repoName: "hello-world",
        repoLanguage: "TypeScript",
        labels: ["bug"],
        beginnerFriendly: false
      });

    expect(saveRes.status).toBe(201);
    expect(saveRes.body.savedIssues).toHaveLength(1);

    const duplicateRes = await request(app)
      .post("/api/me/saved-issues")
      .set(auth)
      .send({
        issueId: "issue-123",
        title: "Fix onboarding bug",
        repoOwner: "octocat",
        repoName: "hello-world"
      });

    expect(duplicateRes.status).toBe(400);
    expect(duplicateRes.body.message).toMatch(/already saved/i);

    const unsaveRes = await request(app)
      .delete("/api/me/saved-issues/issue-123")
      .set(auth);

    expect(unsaveRes.status).toBe(200);
    expect(unsaveRes.body.savedIssues).toHaveLength(0);
  });

  test("DELETE /api/me/saved-issues/:issueId returns 404 when issue is not saved", async () => {
    const app = getTestApp();
    const user = await createUser();

    const res = await request(app)
      .delete("/api/me/saved-issues/missing-issue")
      .set(authHeaderForUserId(String(user._id)));

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found in saved list/i);
  });

  test("recent searches dedupes case-insensitively and keeps only three latest", async () => {
    const app = getTestApp();
    const user = await createUser();
    const auth = authHeaderForUserId(String(user._id));

    await request(app).post("/api/me/recent-searches").set(auth).send({ query: "react" });
    await request(app).post("/api/me/recent-searches").set(auth).send({ query: "node" });
    await request(app).post("/api/me/recent-searches").set(auth).send({ query: "python" });
    await request(app).post("/api/me/recent-searches").set(auth).send({ query: "REACT" });

    const res = await request(app).get("/api/me/recent-searches").set(auth);

    expect(res.status).toBe(200);
    expect(res.body.recentSearches).toEqual(["REACT", "python", "node"]);
  });
});
