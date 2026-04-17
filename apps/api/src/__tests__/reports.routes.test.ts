import request from "supertest";
import { Report } from "../models/Report";
import {
  authHeaderForUserId,
  createIssue,
  createUser,
  getTestApp
} from "./testUtils";

describe("Reports routes", () => {
  test("POST /api/reports rejects unauthenticated requests", async () => {
    const app = getTestApp();
    const issue = await createIssue();

    const res = await request(app).post("/api/reports").send({
      targetType: "issue",
      targetId: String(issue._id),
      reason: "spam",
      description: "This appears to be spam content"
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/no token provided/i);
  });

  test("POST /api/reports returns 400 for invalid target ID", async () => {
    const app = getTestApp();
    const user = await createUser();

    const res = await request(app)
      .post("/api/reports")
      .set(authHeaderForUserId(String(user._id)))
      .send({
        targetType: "issue",
        targetId: "not-a-valid-object-id",
        reason: "spam",
        description: "The report has enough content"
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid target ID");
  });

  test("POST /api/reports creates report and prevents duplicates", async () => {
    const app = getTestApp();
    const reporter = await createUser();
    const issue = await createIssue({ title: "Reportable issue" });

    const firstRes = await request(app)
      .post("/api/reports")
      .set(authHeaderForUserId(String(reporter._id)))
      .send({
        targetType: "issue",
        targetId: String(issue._id),
        reason: "spam",
        description: "This issue appears to be spam and unrelated to collaboration goals"
      });

    expect(firstRes.status).toBe(201);
    expect(firstRes.body.report.targetRef).toBe(
      `octocat/hello-world#${issue.githubNumber}`
    );

    const stored = await Report.findById(firstRes.body.report._id).lean();
    expect(stored).not.toBeNull();
    expect(stored?.priority).toBe("high");

    const duplicateRes = await request(app)
      .post("/api/reports")
      .set(authHeaderForUserId(String(reporter._id)))
      .send({
        targetType: "issue",
        targetId: String(issue._id),
        reason: "misleading",
        description: "Another description that should be rejected as duplicate"
      });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.message).toMatch(/already reported/i);
  });

  test("GET /api/reports/my returns only reports from the requester", async () => {
    const app = getTestApp();
    const userA = await createUser();
    const userB = await createUser();
    const issueA = await createIssue();
    const issueB = await createIssue();

    await Report.create({
      reporterId: userA._id,
      reporterLogin: userA.login,
      targetType: "issue",
      targetId: issueA._id,
      targetRef: `octocat/hello-world#${issueA.githubNumber}`,
      reason: "other",
      description: "User A report description"
    });

    await Report.create({
      reporterId: userB._id,
      reporterLogin: userB.login,
      targetType: "issue",
      targetId: issueB._id,
      targetRef: `octocat/hello-world#${issueB.githubNumber}`,
      reason: "other",
      description: "User B report description"
    });

    const res = await request(app)
      .get("/api/reports/my")
      .set(authHeaderForUserId(String(userA._id)));

    expect(res.status).toBe(200);
    expect(res.body.reports).toHaveLength(1);
    expect(res.body.reports[0].targetRef).toBe(
      `octocat/hello-world#${issueA.githubNumber}`
    );
  });

  test("moderation endpoints require moderator role and allow resolving reports", async () => {
    const app = getTestApp();
    const reporter = await createUser();
    const regularUser = await createUser("user");
    const moderator = await createUser("moderator");
    const issue = await createIssue();

    const report = await Report.create({
      reporterId: reporter._id,
      reporterLogin: reporter.login,
      targetType: "issue",
      targetId: issue._id,
      targetRef: `octocat/hello-world#${issue.githubNumber}`,
      reason: "misleading",
      description: "Details that explain why this report needs moderation"
    });

    const forbiddenRes = await request(app)
      .get("/api/reports")
      .set(authHeaderForUserId(String(regularUser._id)));

    expect(forbiddenRes.status).toBe(403);
    expect(forbiddenRes.body.message).toMatch(/moderator or admin access required/i);

    const listRes = await request(app)
      .get("/api/reports")
      .set(authHeaderForUserId(String(moderator._id)));

    expect(listRes.status).toBe(200);
    expect(listRes.body.reports).toHaveLength(1);

    const resolveRes = await request(app)
      .post(`/api/reports/${report._id}/resolve`)
      .set(authHeaderForUserId(String(moderator._id)))
      .send({
        actionTaken: "Hidden content",
        resolution: "Issue was handled"
      });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.report.status).toBe("resolved");
    expect(resolveRes.body.report.reviewedByLogin).toBe(moderator.login);
  });
});
