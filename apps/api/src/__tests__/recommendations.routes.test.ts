import request from "supertest";
import axios from "axios";
import {
  authHeaderForUserId,
  createIssue,
  createUser,
  getTestApp
} from "./testUtils";
import { User } from "../models/User";

let postSpy: jest.SpiedFunction<typeof axios.post>;
let consoleErrorSpy: jest.SpyInstance;

describe("Recommendations routes", () => {
  beforeEach(() => {
    postSpy = jest.spyOn(axios, "post");
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("GET /api/recommendations rejects unauthenticated requests", async () => {
    const app = getTestApp();

    const res = await request(app).get("/api/recommendations");

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/no token provided/i);
  });

  test("GET /api/recommendations returns no-issues payload when database has no recommendable issues", async () => {
    const app = getTestApp();
    const user = await createUser();

    const res = await request(app)
      .get("/api/recommendations")
      .set(authHeaderForUserId(String(user._id)));

    expect(res.status).toBe(200);
    expect(res.body.method).toBe("no-issues");
    expect(res.body.recommendations).toEqual([]);
    expect(postSpy).not.toHaveBeenCalled();
  });

  test("GET /api/recommendations returns ML recommendations and sorts claimed issues to bottom", async () => {
    const app = getTestApp();
    const user = await createUser();

    await User.findByIdAndUpdate(user._id, {
      $set: {
        preferredLanguages: ["TypeScript"],
        experienceLevel: "beginner",
        areasOfInterest: ["api"]
      }
    });

    const openIssue = await createIssue({
      status: "open",
      title: "Open issue"
    });
    const claimedIssue = await createIssue({
      status: "claimed",
      claimedByLogin: "someone",
      title: "Claimed issue"
    });

    postSpy.mockResolvedValueOnce({
      data: {
        recommendations: [
          { issue_id: String(claimedIssue._id), similarity_score: 0.95 },
          { issue_id: String(openIssue._id), similarity_score: 0.75 }
        ],
        method: "hybrid-ml",
        total_issues_analyzed: 2
      }
    } as any);

    const res = await request(app)
      .get("/api/recommendations?top_n=5")
      .set(authHeaderForUserId(String(user._id)));

    expect(res.status).toBe(200);
    expect(res.body.method).toBe("hybrid-ml");
    expect(res.body.recommendations).toHaveLength(2);
    expect(res.body.recommendations[0].issue_id).toBe(String(openIssue._id));
    expect(res.body.recommendations[0].issue_status).toBe("open");
    expect(res.body.recommendations[1].issue_id).toBe(String(claimedIssue._id));
    expect(res.body.recommendations[1].issue_status).toBe("claimed");
  });

  test("GET /api/recommendations falls back to keyword recommendations when ML service is unavailable", async () => {
    const app = getTestApp();
    const user = await createUser();

    await User.findByIdAndUpdate(user._id, {
      $set: {
        preferredLanguages: ["TypeScript"],
        experienceLevel: "beginner",
        areasOfInterest: ["react"]
      }
    });

    await createIssue({
      status: "open",
      title: "TypeScript starter issue",
      labels: ["good first issue", "typescript"],
      requiredSkills: ["typescript"]
    });

    postSpy.mockRejectedValueOnce({
      code: "ECONNREFUSED",
      message: "ML service unavailable"
    });

    const res = await request(app)
      .get("/api/recommendations?top_n=3")
      .set(authHeaderForUserId(String(user._id)));

    expect(res.status).toBe(200);
    expect(res.body.method).toBe("fallback-keyword");
    expect(Array.isArray(res.body.recommendations)).toBe(true);
    expect(res.body.recommendations.length).toBeGreaterThanOrEqual(1);
  });

  test("POST /api/recommendations/custom returns fallback payload when ML service errors", async () => {
    const app = getTestApp();
    const user = await createUser();

    await createIssue({ status: "open", title: "Any issue" });

    postSpy.mockRejectedValueOnce({
      response: { status: 503 },
      message: "downstream unavailable"
    });

    const res = await request(app)
      .post("/api/recommendations/custom")
      .set(authHeaderForUserId(String(user._id)))
      .send({
        languages: ["python"],
        difficulty: "beginner",
        topics: ["data"],
        top_n: 2
      });

    expect(res.status).toBe(200);
    expect(res.body.method).toBe("fallback");
    expect(res.body.error).toMatch(/ml service unavailable/i);
    expect(res.body.recommendations).toEqual([]);
  });
});
