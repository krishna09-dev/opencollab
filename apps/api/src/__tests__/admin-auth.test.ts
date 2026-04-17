import request from "supertest";
import { AdminUser } from "../models/AdminUser";
import { getTestApp } from "./testUtils";

describe("Admin auth routes", () => {
  test("POST /auth/admin/register rejects missing username/password", async () => {
    const app = getTestApp();

    const res = await request(app).post("/auth/admin/register").send({
      username: "",
      password: ""
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  test("POST /auth/admin/register rejects short username", async () => {
    const app = getTestApp();

    const res = await request(app).post("/auth/admin/register").send({
      username: "ab",
      password: "password123"
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/at least 3 characters/i);
  });

  test("POST /auth/admin/register rejects invalid role", async () => {
    const app = getTestApp();

    const res = await request(app).post("/auth/admin/register").send({
      username: "role-check",
      password: "password123",
      role: "owner"
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/role must be admin or moderator/i);
  });

  test("POST /auth/admin/register creates an admin user", async () => {
    const app = getTestApp();

    const res = await request(app).post("/auth/admin/register").send({
      username: "admin-main",
      password: "password123",
      role: "admin"
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.admin.username).toBe("admin-main");
    expect(res.body.admin.role).toBe("admin");

    const doc = await AdminUser.findOne({ username: "admin-main" });
    expect(doc).not.toBeNull();
  });

  test("POST /auth/admin/register rejects duplicate username", async () => {
    const app = getTestApp();

    await request(app).post("/auth/admin/register").send({
      username: "dupe-admin",
      password: "password123",
      role: "admin"
    });

    const res = await request(app).post("/auth/admin/register").send({
      username: "dupe-admin",
      password: "password123",
      role: "admin"
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already taken/i);
  });

  test("POST /auth/admin/login returns token for valid credentials", async () => {
    const app = getTestApp();

    await request(app).post("/auth/admin/register").send({
      username: "login-admin",
      password: "password123",
      role: "moderator"
    });

    const res = await request(app).post("/auth/admin/login").send({
      username: "login-admin",
      password: "password123"
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.admin.username).toBe("login-admin");
    expect(res.body.admin.role).toBe("moderator");
  });

  test("POST /auth/admin/login rejects invalid password", async () => {
    const app = getTestApp();

    await request(app).post("/auth/admin/register").send({
      username: "invalid-login-admin",
      password: "password123",
      role: "admin"
    });

    const res = await request(app).post("/auth/admin/login").send({
      username: "invalid-login-admin",
      password: "wrong-pass"
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid username or password/i);
  });

  test("POST /auth/admin/login rejects unknown username", async () => {
    const app = getTestApp();

    const res = await request(app).post("/auth/admin/login").send({
      username: "missing-admin",
      password: "password123"
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid username or password/i);
  });

  test("GET /auth/admin/me returns current admin", async () => {
    const app = getTestApp();

    const registerRes = await request(app).post("/auth/admin/register").send({
      username: "me-admin",
      password: "password123",
      role: "admin"
    });

    const res = await request(app)
      .get("/auth/admin/me")
      .set("Authorization", `Bearer ${registerRes.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.username).toBe("me-admin");
    expect(res.body.role).toBe("admin");
  });

  test("GET /auth/admin/me rejects missing token", async () => {
    const app = getTestApp();

    const res = await request(app).get("/auth/admin/me");

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/no token provided/i);
  });
});
