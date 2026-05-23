import request from "supertest";
import { getTestApp } from "./testUtils";

describe("Health route", () => {
  test("GET /health returns deployment-ready status details", async () => {
    const app = getTestApp();
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("opencollab-api");
    expect(typeof res.body.timestamp).toBe("string");
    expect(["development", "test", "production"]).toContain(res.body.environment);
    expect(res.body.checks).toBeDefined();
    expect(["connected", "disconnected"]).toContain(res.body.checks.database);
    expect(["configured", "missing"]).toContain(res.body.checks.githubSystemToken);
    expect(["configured", "missing"]).toContain(res.body.checks.mlServiceUrl);
  });
});
