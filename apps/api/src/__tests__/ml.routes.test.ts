import request from "supertest";
import axios from "axios";
import { Issue } from "../models/Issue";
import { authHeaderForUserId, createIssue, createUser, getTestApp } from "./testUtils";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("ML routes", () => {
  test("GET /api/ml/health returns degraded when ML service is unavailable", async () => {
    const app = getTestApp();
    mockedAxios.get.mockRejectedValueOnce(new Error("Service unavailable"));

    const res = await request(app).get("/api/ml/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("degraded");
    expect(res.body.connected).toBe(false);
    expect(res.body.fallback).toBe("local-scoring");
  });

  test("POST /api/ml/score/:id denies non-moderator users", async () => {
    const app = getTestApp();
    const user = await createUser("user");
    const issue = await createIssue();

    const res = await request(app)
      .post(`/api/ml/score/${issue._id}`)
      .set(authHeaderForUserId(String(user._id)));

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/moderator or admin access required/i);
  });

  test("POST /api/ml/score/:id scores issue using local fallback when ML service fails", async () => {
    const app = getTestApp();
    const moderator = await createUser("moderator");
    const issue = await createIssue({
      title: "Good first task",
      labels: ["good first issue"],
      body: "Detailed issue body to provide enough local signal for fallback scoring."
    });

    mockedAxios.post.mockRejectedValueOnce(new Error("Service unavailable"));

    const res = await request(app)
      .post(`/api/ml/score/${issue._id}`)
      .set(authHeaderForUserId(String(moderator._id)));

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Issue scored successfully");
    expect(res.body.mlScoring.modelVersion).toBe("local-fallback-v1");
    expect(res.body.mlScoring.beginnerScore).toBeGreaterThan(0);

    const updated = await Issue.findById(issue._id).lean();
    expect(updated?.mlScoring?.modelVersion).toBe("local-fallback-v1");
  });

  test("POST /api/ml/override/:id denies moderator users", async () => {
    const app = getTestApp();
    const moderator = await createUser("moderator");
    const issue = await createIssue();

    const res = await request(app)
      .post(`/api/ml/override/${issue._id}`)
      .set(authHeaderForUserId(String(moderator._id)))
      .send({
        newScore: 0.91,
        reason: "Moderator should not be able to override"
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/admin access required/i);
  });

  test("POST and DELETE /api/ml/override/:id allow admin to set and remove override", async () => {
    const app = getTestApp();
    const admin = await createUser("admin");

    const issue = await createIssue({
      mlScoring: {
        beginnerScore: 0.42,
        confidence: 0.8,
        features: {
          labelScore: 0.5,
          descriptionLength: 0.5,
          keywordScore: 0.4,
          complexityScore: 0.4,
          clarityScore: 0.6
        },
        explanation: "Pre-scored",
        scoredAt: new Date(),
        modelVersion: "seed-v1"
      }
    });

    const overrideRes = await request(app)
      .post(`/api/ml/override/${issue._id}`)
      .set(authHeaderForUserId(String(admin._id)))
      .send({
        newScore: 0.9,
        reason: "Manual review confirms this is beginner-friendly"
      });

    expect(overrideRes.status).toBe(200);
    expect(overrideRes.body.override.newScore).toBe(0.9);

    const deleteRes = await request(app)
      .delete(`/api/ml/override/${issue._id}`)
      .set(authHeaderForUserId(String(admin._id)));

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.message).toBe("Override removed");

    const updated = await Issue.findById(issue._id).lean();
    expect(updated?.mlOverride).toBeFalsy();
  });

  test("GET /api/ml/issues supports override filter and exposes effectiveScore", async () => {
    const app = getTestApp();
    const moderator = await createUser("moderator");

    await createIssue({
      title: "Issue without override",
      beginnerFriendly: true,
      mlScoring: {
        beginnerScore: 0.6,
        confidence: 0.9,
        features: {
          labelScore: 0.8,
          descriptionLength: 0.5,
          keywordScore: 0.7,
          complexityScore: 0.4,
          clarityScore: 0.6
        },
        explanation: "Model score",
        scoredAt: new Date(),
        modelVersion: "seed-v1"
      }
    });

    await createIssue({
      title: "Issue with override",
      beginnerFriendly: false,
      mlScoring: {
        beginnerScore: 0.2,
        confidence: 0.7,
        features: {
          labelScore: 0.1,
          descriptionLength: 0.4,
          keywordScore: 0.2,
          complexityScore: 0.7,
          clarityScore: 0.4
        },
        explanation: "Model score",
        scoredAt: new Date(),
        modelVersion: "seed-v1"
      },
      mlOverride: {
        overriddenBy: String(moderator._id),
        overriddenAt: new Date(),
        originalScore: 0.2,
        newScore: 0.85,
        reason: "Manual override for onboarding campaign"
      }
    });

    const res = await request(app)
      .get("/api/ml/issues?hasOverride=true&page=1&limit=10")
      .set(authHeaderForUserId(String(moderator._id)));

    expect(res.status).toBe(200);
    expect(res.body.issues).toHaveLength(1);
    expect(res.body.issues[0].title).toBe("Issue with override");
    expect(res.body.issues[0].effectiveScore).toBe(0.85);
    expect(res.body.pagination.total).toBe(1);
  });
});
