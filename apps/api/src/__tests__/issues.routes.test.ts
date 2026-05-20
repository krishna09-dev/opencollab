import request from "supertest";
import { Notification } from "../models/Notification";
import { authHeaderForUserId, createIssue, createUser, getTestApp } from "./testUtils";

describe("Issues routes", () => {
  test("GET /api/issues/stats and /api/issues/languages return computed values", async () => {
    const app = getTestApp();
    const user = await createUser();
    const auth = authHeaderForUserId(String(user._id));

    await createIssue({ repoLanguage: "TypeScript", beginnerFriendly: true, status: "open" });
    await createIssue({ repoLanguage: "Python", beginnerFriendly: false, labels: [], status: "claimed" });
    await createIssue({
      repoLanguage: null,
      beginnerFriendly: false,
      isVisible: false,
      isApproved: false,
      status: "closed"
    });

    const statsRes = await request(app).get("/api/issues/stats").set(auth);
    expect(statsRes.status).toBe(200);
    expect(statsRes.body.total).toBe(3);
    expect(statsRes.body.open).toBe(1);
    expect(statsRes.body.beginner).toBe(1);

    const langRes = await request(app).get("/api/issues/languages").set(auth);
    expect(langRes.status).toBe(200);
    expect(langRes.body.languages).toEqual(["Python", "TypeScript"]);
  });

  test("GET /api/issues returns only approved and visible issues", async () => {
    const app = getTestApp();
    const user = await createUser();
    const auth = authHeaderForUserId(String(user._id));

    await createIssue({ title: "Visible issue", isApproved: true, isVisible: true });
    await createIssue({ title: "Hidden issue", isApproved: true, isVisible: false });
    await createIssue({ title: "Unapproved issue", isApproved: false, isVisible: true });

    const res = await request(app).get("/api/issues?page=1&limit=10").set(auth);

    expect(res.status).toBe(200);
    expect(res.body.issues).toHaveLength(1);
    expect(res.body.issues[0].title).toBe("Visible issue");
    expect(res.body.pagination.total).toBe(1);
  });

  test("claim flow enforces ownership and supports abort", async () => {
    const app = getTestApp();
    const userA = await createUser();
    const userB = await createUser();
    const issue = await createIssue();

    const claimRes = await request(app)
      .post(`/api/issues/${issue._id}/claim`)
      .set(authHeaderForUserId(String(userA._id)));

    expect(claimRes.status).toBe(200);
    expect(claimRes.body.issue.status).toBe("claimed");
    expect(claimRes.body.issue.claimedByUserId).toBe(String(userA._id));

    const claimByOtherRes = await request(app)
      .post(`/api/issues/${issue._id}/claim`)
      .set(authHeaderForUserId(String(userB._id)));

    expect(claimByOtherRes.status).toBe(409);

    const abortRes = await request(app)
      .post(`/api/issues/${issue._id}/abort`)
      .set(authHeaderForUserId(String(userA._id)));

    expect(abortRes.status).toBe(200);
    expect(abortRes.body.issue.status).toBe("open");
  });

  test("claim is atomic and allows only one successful claimant", async () => {
    const app = getTestApp();
    const userA = await createUser();
    const userB = await createUser();
    const issue = await createIssue();

    const [resA, resB] = await Promise.all([
      request(app)
        .post(`/api/issues/${issue._id}/claim`)
        .set(authHeaderForUserId(String(userA._id))),
      request(app)
        .post(`/api/issues/${issue._id}/claim`)
        .set(authHeaderForUserId(String(userB._id)))
    ]);

    const statuses = [resA.status, resB.status].sort((a, b) => a - b);
    expect(statuses).toEqual([200, 409]);
  });

  test("notify + abort sends watcher notification", async () => {
    const app = getTestApp();
    const owner = await createUser();
    const watcher = await createUser();
    const issue = await createIssue();

    await request(app)
      .post(`/api/issues/${issue._id}/claim`)
      .set(authHeaderForUserId(String(owner._id)));

    const notifyRes = await request(app)
      .post(`/api/issues/${issue._id}/notify`)
      .set(authHeaderForUserId(String(watcher._id)));

    expect(notifyRes.status).toBe(200);

    await request(app)
      .post(`/api/issues/${issue._id}/abort`)
      .set(authHeaderForUserId(String(owner._id)));

    const delivered = await Notification.find({ userId: String(watcher._id) });
    expect(delivered).toHaveLength(1);
    expect(delivered[0].type).toBe("ISSUE_AVAILABLE");
  });
});
