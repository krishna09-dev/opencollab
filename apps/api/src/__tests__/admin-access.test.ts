import request from "supertest";
import { ApprovedRepo } from "../models/ApprovedRepo";
import {
  authHeaderForUserId,
  createAdminUser,
  createUser,
  getTestApp
} from "./testUtils";

describe("Admin access control", () => {
  test("GET /api/admin/repos denies request without token", async () => {
    const app = getTestApp();

    const res = await request(app).get("/api/admin/repos");

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/no token provided/i);
  });

  test("GET /api/admin/repos denies non-admin user", async () => {
    const app = getTestApp();
    const user = await createUser("user");

    const res = await request(app)
      .get("/api/admin/repos")
      .set(authHeaderForUserId(String(user._id)));

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/admin access required/i);
  });

  test("GET /api/admin/repos denies moderator role", async () => {
    const app = getTestApp();
    const moderator = await createAdminUser("moderator");

    const res = await request(app)
      .get("/api/admin/repos")
      .set(authHeaderForUserId(String(moderator._id)));

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/admin access required/i);
  });

  test("GET /api/admin/repos allows admin role", async () => {
    const app = getTestApp();
    const admin = await createAdminUser("admin");

    await ApprovedRepo.create({
      fullName: "octocat/hello-world",
      repoOwner: "octocat",
      repoName: "hello-world",
      isActive: true
    });

    const res = await request(app)
      .get("/api/admin/repos")
      .set(authHeaderForUserId(String(admin._id)));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.repos)).toBe(true);
    expect(res.body.repos).toHaveLength(1);
    expect(res.body.repos[0].fullName).toBe("octocat/hello-world");
  });
});
