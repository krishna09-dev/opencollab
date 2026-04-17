import request from "supertest";
import axios from "axios";
import { Issue } from "../models/Issue";
import {
  authHeaderForUserId,
  createIssue,
  createUser,
  getTestApp
} from "./testUtils";

let patchSpy: jest.SpiedFunction<typeof axios.patch>;

describe("Admin claims routes", () => {
  beforeEach(() => {
    process.env.GITHUB_SYSTEM_TOKEN = "test-system-token";
    patchSpy = jest.spyOn(axios, "patch").mockResolvedValue({ data: {} } as any);
  });

  test("GET /api/admin/claims denies regular users", async () => {
    const app = getTestApp();
    const user = await createUser("user");

    const res = await request(app)
      .get("/api/admin/claims")
      .set(authHeaderForUserId(String(user._id)));

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/moderator or admin access required/i);
  });

  test("GET /api/admin/claims lists claimed issues with stale metadata", async () => {
    const app = getTestApp();
    const admin = await createUser("admin");
    const claimer = await createUser("user");

    const staleDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

    await createIssue({
      title: "Claimed stale issue",
      status: "claimed",
      claimedByUserId: String(claimer._id),
      claimedByLogin: claimer.login,
      claimedAt: staleDate
    });

    const res = await request(app)
      .get("/api/admin/claims?staleOnly=true&staleDays=7")
      .set(authHeaderForUserId(String(admin._id)));

    expect(res.status).toBe(200);
    expect(res.body.issues).toHaveLength(1);
    expect(res.body.issues[0].isStale).toBe(true);
    expect(res.body.issues[0].daysSinceClaim).toBeGreaterThanOrEqual(10);
  });

  test("GET /api/admin/claims/stats returns claim aggregate counts", async () => {
    const app = getTestApp();
    const admin = await createUser("admin");
    const claimer = await createUser("user");

    await createIssue({
      status: "claimed",
      claimedByUserId: String(claimer._id),
      claimedByLogin: claimer.login,
      claimedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      prStatus: "PR_OPEN"
    });

    await createIssue({
      status: "claimed",
      claimedByUserId: String(claimer._id),
      claimedByLogin: claimer.login,
      claimedAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
      prStatus: "MERGED"
    });

    const res = await request(app)
      .get("/api/admin/claims/stats")
      .set(authHeaderForUserId(String(admin._id)));

    expect(res.status).toBe(200);
    expect(res.body.totalClaimed).toBe(2);
    expect(res.body.stale7Days).toBe(2);
    expect(res.body.stale14Days).toBe(1);
    expect(res.body.withPrOpen).toBe(1);
    expect(res.body.withPrMerged).toBe(1);
  });

  test("GET /api/admin/claims/:id returns issue claim details and claimant", async () => {
    const app = getTestApp();
    const admin = await createUser("admin");
    const claimer = await createUser("user");

    const issue = await createIssue({
      status: "claimed",
      claimedByUserId: String(claimer._id),
      claimedByLogin: claimer.login,
      claimedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    });

    const res = await request(app)
      .get(`/api/admin/claims/${issue._id}`)
      .set(authHeaderForUserId(String(admin._id)));

    expect(res.status).toBe(200);
    expect(res.body.issue._id).toBe(String(issue._id));
    expect(res.body.claimant.login).toBe(claimer.login);
    expect(res.body.daysSinceClaim).toBeGreaterThanOrEqual(3);
  });

  test("POST /api/admin/claims/:id/force-release reopens claim and returns watcher notification count", async () => {
    const app = getTestApp();
    const admin = await createUser("admin");
    const claimer = await createUser("user");
    const watcher = await createUser("user");

    const issue = await createIssue({
      status: "claimed",
      claimedByUserId: String(claimer._id),
      claimedByLogin: claimer.login,
      claimedAt: new Date(),
      contributionTimeline: [
        {
          id: "claimed_1",
          title: "Claimed",
          status: "claimed",
          at: new Date()
        }
      ],
      notifyWatchers: [String(claimer._id), String(watcher._id)]
    });

    const res = await request(app)
      .post(`/api/admin/claims/${issue._id}/force-release`)
      .set(authHeaderForUserId(String(admin._id)))
      .send({ reason: "Inactive for too long" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/notified 2 watchers/i);
    expect(patchSpy).toHaveBeenCalledTimes(1);

    const updatedIssue = await Issue.findById(issue._id).lean();
    expect(updatedIssue?.status).toBe("open");
    expect(updatedIssue?.claimedByUserId).toBeUndefined();
    expect(updatedIssue?.claimedByLogin).toBeUndefined();
    expect(updatedIssue?.contributionTimeline).toEqual([]);
    expect(updatedIssue?.updates.length).toBeGreaterThanOrEqual(1);
  });
});
