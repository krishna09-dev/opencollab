import request from "supertest";
import axios from "axios";
import { ApprovedRepo } from "../models/ApprovedRepo";
import { Issue } from "../models/Issue";
import { PrTracking } from "../models/PrTracking";
import {
  authHeaderForUserId,
  createIssue,
  createUser,
  getTestApp
} from "./testUtils";
let getSpy: jest.SpiedFunction<typeof axios.get>;

describe("Admin repos routes", () => {
  beforeEach(() => {
    getSpy = jest.spyOn(axios, "get");
  });

  test("POST /api/admin/repos denies non-admin users", async () => {
    const app = getTestApp();
    const user = await createUser("user");

    const res = await request(app)
      .post("/api/admin/repos")
      .set(authHeaderForUserId(String(user._id)))
      .send({ fullName: "octocat/hello-world" });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/admin access required/i);
  });

  test("POST /api/admin/repos validates owner/repo format", async () => {
    const app = getTestApp();
    const admin = await createUser("admin");

    const res = await request(app)
      .post("/api/admin/repos")
      .set(authHeaderForUserId(String(admin._id)))
      .send({ fullName: "invalid-format" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation failed");
  });

  test("POST /api/admin/repos creates repository with GitHub metadata", async () => {
    const app = getTestApp();
    const admin = await createUser("admin");

    getSpy.mockResolvedValueOnce({
      data: {
        description: "Repository description",
        html_url: "https://github.com/acme/tools"
      }
    } as any);

    const res = await request(app)
      .post("/api/admin/repos")
      .set(authHeaderForUserId(String(admin._id)))
      .send({ fullName: "acme/tools" });

    expect(res.status).toBe(201);
    expect(res.body.repo.fullName).toBe("acme/tools");
    expect(res.body.repo.description).toBe("Repository description");

    const stored = await ApprovedRepo.findOne({ fullName: "acme/tools" }).lean();
    expect(stored).not.toBeNull();
    expect(stored?.repoOwner).toBe("acme");
    expect(stored?.repoName).toBe("tools");
  });

  test("PATCH /api/admin/repos/:id deactivates repo and clears related PR data", async () => {
    const app = getTestApp();
    const admin = await createUser("admin");
    const owner = await createUser("user");

    const repo = await ApprovedRepo.create({
      fullName: "acme/deactivate-me",
      repoOwner: "acme",
      repoName: "deactivate-me",
      isActive: true
    });

    const issue = await createIssue({
      repoOwner: "acme",
      repoName: "deactivate-me",
      prStatus: "PR_OPEN",
      isVisible: true
    });

    await PrTracking.create({
      userId: owner._id,
      repoFullName: "acme/deactivate-me",
      issueNumber: issue.githubNumber,
      issueTitle: issue.title,
      prNumber: 321,
      prUrl: "https://github.com/acme/deactivate-me/pull/321",
      status: "PR_OPEN"
    });

    const res = await request(app)
      .patch(`/api/admin/repos/${repo._id}`)
      .set(authHeaderForUserId(String(admin._id)))
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/repo deactivated/i);
    expect(res.body.cleanup.deletedPrCount).toBe(1);

    const issueAfter = await Issue.findById(issue._id).lean();
    expect(issueAfter?.isVisible).toBe(false);
    expect(issueAfter?.prStatus).toBe("NONE");
  });

  test("DELETE /api/admin/repos/:id removes repo, issues, and PR records", async () => {
    const app = getTestApp();
    const admin = await createUser("admin");
    const owner = await createUser("user");

    const repo = await ApprovedRepo.create({
      fullName: "noncore/delete-me",
      repoOwner: "noncore",
      repoName: "delete-me",
      isActive: true
    });

    const issue = await createIssue({
      repoOwner: "noncore",
      repoName: "delete-me"
    });

    await PrTracking.create({
      userId: owner._id,
      repoFullName: "noncore/delete-me",
      issueNumber: issue.githubNumber,
      issueTitle: issue.title,
      prNumber: 999,
      prUrl: "https://github.com/noncore/delete-me/pull/999",
      status: "MERGED"
    });

    const res = await request(app)
      .delete(`/api/admin/repos/${repo._id}`)
      .set(authHeaderForUserId(String(admin._id)));

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/repo deleted and related data removed/i);
    expect(res.body.cleanup.deletedPrCount).toBe(1);
    expect(res.body.cleanup.deletedIssueCount).toBe(1);

    const repoAfter = await ApprovedRepo.findById(repo._id).lean();
    const issueAfter = await Issue.findById(issue._id).lean();
    const prAfter = await PrTracking.findOne({ repoFullName: "noncore/delete-me" }).lean();

    expect(repoAfter).toBeNull();
    expect(issueAfter).toBeNull();
    expect(prAfter).toBeNull();
  });
});
