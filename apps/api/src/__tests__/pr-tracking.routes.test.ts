import request from "supertest";
import { ApprovedRepo } from "../models/ApprovedRepo";
import { PrTracking } from "../models/PrTracking";
import { createIssue, createUser, authHeaderForUserId, getTestApp } from "./testUtils";

describe("PR tracking routes", () => {
  test("POST /api/pr-tracking/ensure rejects request without token", async () => {
    const app = getTestApp();

    const res = await request(app).post("/api/pr-tracking/ensure").send({
      repoFullName: "octocat/hello-world",
      issueNumber: 10,
      issueTitle: "Issue title"
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/no token provided/i);
  });

  test("POST /api/pr-tracking/ensure creates tracking for approved repository", async () => {
    const app = getTestApp();
    const user = await createUser("user");

    await ApprovedRepo.create({
      fullName: "octocat/hello-world",
      repoOwner: "octocat",
      repoName: "hello-world",
      isActive: true
    });

    const res = await request(app)
      .post("/api/pr-tracking/ensure")
      .set(authHeaderForUserId(String(user._id)))
      .send({
        repoFullName: "octocat/hello-world",
        issueNumber: 101,
        issueTitle: "Track this issue"
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Tracking ensured");
    expect(res.body.item.repoFullName).toBe("octocat/hello-world");
    expect(res.body.item.status).toBe("ACCEPTED");

    const doc = await PrTracking.findById(res.body.item._id).lean();
    expect(doc).not.toBeNull();
    expect(doc?.issueNumber).toBe(101);
  });

  test("POST /api/pr-tracking/ensure rejects non-approved repository", async () => {
    const app = getTestApp();
    const user = await createUser("user");

    const res = await request(app)
      .post("/api/pr-tracking/ensure")
      .set(authHeaderForUserId(String(user._id)))
      .send({
        repoFullName: "unknown/repo",
        issueNumber: 101,
        issueTitle: "Track this issue"
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/not approved/i);
  });

  test("GET /api/pr-tracking returns owner and shared visible items", async () => {
    const app = getTestApp();
    const user = await createUser("user");
    const other = await createUser("user");

    const owned = await PrTracking.create({
      userId: user._id,
      repoFullName: "octocat/hello-world",
      issueNumber: 11,
      issueTitle: "Owned PR",
      prNumber: 10,
      prUrl: "https://github.com/octocat/hello-world/pull/10",
      status: "PR_OPEN"
    });

    const shared = await PrTracking.create({
      userId: other._id,
      allowedUserIds: [user._id],
      repoFullName: "octocat/hello-world",
      issueNumber: 12,
      issueTitle: "Shared PR",
      prNumber: 11,
      prUrl: "https://github.com/octocat/hello-world/pull/11",
      status: "MERGED"
    });

    await PrTracking.create({
      userId: other._id,
      repoFullName: "octocat/hello-world",
      issueNumber: 13,
      issueTitle: "Private PR",
      prNumber: 12,
      prUrl: "https://github.com/octocat/hello-world/pull/12",
      status: "PR_OPEN"
    });

    const res = await request(app)
      .get("/api/pr-tracking")
      .set(authHeaderForUserId(String(user._id)));

    expect(res.status).toBe(200);
    expect(res.body.summary.total).toBe(2);

    const ids = res.body.items.map((item: any) => String(item._id));
    expect(ids).toEqual(expect.arrayContaining([String(owned._id), String(shared._id)]));
  });

  test("GET /api/pr-tracking/issue/:issueId returns 404 for placeholder tracking without PR metadata", async () => {
    const app = getTestApp();
    const user = await createUser("user");
    const issue = await createIssue();

    await PrTracking.create({
      userId: user._id,
      issueId: issue._id,
      repoFullName: "octocat/hello-world",
      issueNumber: issue.githubNumber,
      issueTitle: issue.title,
      status: "ACCEPTED"
    });

    const res = await request(app)
      .get(`/api/pr-tracking/issue/${issue._id}`)
      .set(authHeaderForUserId(String(user._id)));

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/no pr tracking found/i);
  });

  test("GET /api/pr-tracking/issue/:issueId returns submitted PR tracking entry", async () => {
    const app = getTestApp();
    const user = await createUser("user");
    const issue = await createIssue();

    await PrTracking.create({
      userId: user._id,
      issueId: issue._id,
      repoFullName: "octocat/hello-world",
      issueNumber: issue.githubNumber,
      issueTitle: issue.title,
      prNumber: 77,
      prUrl: "https://github.com/octocat/hello-world/pull/77",
      prTitle: "Fix issue",
      status: "PR_OPEN"
    });

    const res = await request(app)
      .get(`/api/pr-tracking/issue/${issue._id}`)
      .set(authHeaderForUserId(String(user._id)));

    expect(res.status).toBe(200);
    expect(res.body.prNumber).toBe(77);
    expect(res.body.status).toBe("PR_OPEN");
  });
});
