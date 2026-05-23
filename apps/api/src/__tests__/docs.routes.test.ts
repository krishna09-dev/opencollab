import request from "supertest";
import { getTestApp } from "./testUtils";

describe("Docs info route", () => {
  test("GET /api/docs-info returns API module overview", async () => {
    const app = getTestApp();
    const res = await request(app).get("/api/docs-info");

    expect(res.status).toBe(200);
    expect(res.body.service).toBe("OpenCollab API");
    expect(res.body.version).toBe("1.0.0");
    expect(Array.isArray(res.body.modules)).toBe(true);
    expect(res.body.modules.length).toBeGreaterThan(0);
  });
});
