import request from "supertest";
import { getTestApp } from "./testUtils";

describe("Health route", () => {
  test("GET /health returns ok", async () => {
    const app = getTestApp();
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
